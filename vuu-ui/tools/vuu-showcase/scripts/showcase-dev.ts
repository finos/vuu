import mdx from "@mdx-js/rollup";
import fs from "fs";
import MagicString from "magic-string";
import { createFilter, createServer, type PluginOption } from "vite";
import INDEX_HTML from "./html-template";
import path from "path";
import Watcher from "watcher";

import { createFolder, linkSourceDirectory, writeFile } from "./utils";
import { treeSourceFromFileSystem } from "./treeSourceFromFileSystem";

const pathToExhibits = "./src/examples";

// 1) Build the exhibit structure that will be used to create nav tree in showcase GUI
const [treeSourceJson /*, tags*/] = treeSourceFromFileSystem(pathToExhibits);

const watcher = new Watcher(pathToExhibits, {
  recursive: true,
  ignoreInitial: true,
});
watcher.on("all", (event, targetPath /* targetPathNext*/) => {
  // This is what the library does internally when you pass it a handler directly
  console.log(`[watcher] ${event} ${targetPath}`); // => could be any target event: 'add', 'addDir', 'change', 'rename', 'renameDir', 'unlink' or 'unlinkDir'
  // console.log(targetPathNext); // => the file system path "targetPath" got renamed to, this is only provided on 'rename'/'renameDir' events
});

const cwd = process.cwd();
const __dirname = path.join(cwd, ".showcase/dev");

/**
 * This plugin is invoked when we run showcase in dev mode
 */
// This plugin adds "?inline" to each css import within our components to disable
// vite's own style injection used in storybook
function cssInline(): PluginOption {
  const exclude = ["**/**.stories.tsx"];
  const include = [
    "**/packages/grid-layout/**/*.{tsx,jsx}",
    "**/packages/vuu-context-menu/**/*.{tsx,jsx}",
    "**/packages/vuu-datatable/**/*.{tsx,jsx}",
    "**/packages/vuu-data-react/**/*.{tsx,jsx}",
    "**/packages/vuu-filters/**/*.{tsx,jsx}",
    "**/packages/vuu-layout/**/*.{tsx,jsx}",
    "**/packages/vuu-popups/**/*.{tsx,jsx}",
    "**/packages/vuu-shell/**/*.{tsx,jsx}",
    "**/packages/vuu-table/**/*.{tsx,jsx}",
    "**/packages/vuu-table-extras/**/*.{tsx,jsx}",
    "**/packages/vuu-ui-controls/**/*.{tsx,jsx}",
  ];
  const filter = createFilter(include, exclude);

  return {
    name: "vite-plugin-inline-css",
    enforce: "pre",
    transform(src, id) {
      if (filter(id)) {
        const s = new MagicString(src);
        s.replaceAll('.css";', '.css?inline";');
        return {
          code: s.toString(),
          map: s.generateMap({ hires: true, source: id }),
        };
      }
    },
  };
}

// 2) Create the .showcase working directory
if (!fs.existsSync(".showcase/dev")) {
  createFolder(".showcase/dev");
}

// 2.1 create a symlink to location of src folder for exhibits
linkSourceDirectory("dev");

// 2.2 copy the treeSourceJson
await writeFile(
  `export default ${JSON.stringify(treeSourceJson)};`,
  "./.showcase/dev/treeSourceJson.js",
);

// 2.3 create index.html
await writeFile(INDEX_HTML, "./.showcase/dev/index.html");

/**
 * Launch vite dev server, which will begin serving index.html.
 * This will in import one of the followingb depending on url
 * - index-main.ts - the Showcase Shell, hosts application chrome and an IFRame
 * - index-standalone.ts runs exhibit code in IFrame
 */

const server = await createServer({
  build: {
    minify: false,
    sourcemap: true,
    target: "esnext",
  },
  configFile: false,
  define: {
    "process.env.NODE_DEBUG": false,
  },
  esbuild: {
    jsx: `automatic`,
    target: "esnext",
  },
  optimizeDeps: {
    include: ["@salt-ds/core", "@salt-ds/lab", "@salt-ds/icons"],
  },
  root: __dirname,
  plugins: [cssInline(), mdx()],
  server: {
    proxy: {
      "/api/authn": {
        // target: "https://localhost:8443",
        target: "https://localhost:8090",
        secure: false,
      },
    },
  },
});
await server.listen();

server.printUrls();
server.bindCLIShortcuts({ print: true });

// console.log(`opening showcase at ${chalk.green("http://localhost:5173/")} ...`);
// open("http://localhost:5173/");

process.on("SIGINT", async function () {
  console.log("[showcase-dev] shutting down");
  watcher.close();
  await server.close();
  process.exit();
});
