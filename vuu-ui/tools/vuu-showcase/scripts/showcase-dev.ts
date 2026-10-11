import mdx from "@mdx-js/rollup";
import { mdxOptions } from "./mdx-options";
import fs from "fs";
import MagicString from "magic-string";
import { createFilter, createServer, type PluginOption } from "vite";
import INDEX_HTML from "./html-template";
import path from "path";
import Watcher from "watcher";

import { createFolder, linkSourceDirectory, writeFile } from "./utils";
import { treeSourceFromFileSystem } from "./treeSourceFromFileSystem";
import {
  highlightSource,
  resolveSourcePath,
  SOURCE_URL_PREFIX,
} from "./highlight-source";

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
    "**/packages/vuu-chart/**/*.{tsx,jsx}",
    "**/packages/vuu-context-menu/**/*.{tsx,jsx}",
    "**/packages/vuu-datatable/**/*.{tsx,jsx}",
    "**/packages/vuu-data-react/**/*.{tsx,jsx}",
    "**/packages/vuu-filters/**/*.{tsx,jsx}",
    "**/packages/vuu-layout/**/*.{tsx,jsx}",
    "**/packages/vuu-notifications/**/*.{tsx,jsx}",
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

/**
 * Serves highlighted example source, see highlight-source.ts. In dev this is
 * done on request, so the source is always current. The prod build writes
 * every file up front.
 */
function exampleSource(): PluginOption {
  return {
    name: "vuu-showcase-example-source",
    configureServer(server) {
      server.middlewares.use(SOURCE_URL_PREFIX, async (req, res, next) => {
        const urlPath = (req.url ?? "").split("?")[0].replace(/^\//, "");
        const filePath = urlPath.endsWith(".json")
          ? resolveSourcePath(cwd, urlPath.slice(0, -".json".length))
          : undefined;
        if (filePath === undefined || !fs.existsSync(filePath)) {
          return next();
        }
        try {
          const code = fs.readFileSync(filePath, "utf8");
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(await highlightSource(code)));
        } catch (err) {
          next(err);
        }
      });
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
    // enables Open in VS Code links, dev only
    "process.env.SHOWCASE_SOURCE_ROOT": JSON.stringify(cwd),
  },
  esbuild: {
    jsx: `automatic`,
    target: "esnext",
  },
  optimizeDeps: {
    include: ["@salt-ds/core", "@salt-ds/icons"],
  },
  root: __dirname,
  plugins: [cssInline(), exampleSource(), mdx(mdxOptions)],
  server: {
    proxy: {
      "/api/authn": {
        target: "https://localhost:8443",
        // target: "https://localhost:8090",
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
