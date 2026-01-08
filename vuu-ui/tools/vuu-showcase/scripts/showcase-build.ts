import { createFolder, formatDuration, writeFile } from "./utils.ts";
import { build } from "./esbuild.ts";
import { buildFileList } from "./build-file-list.ts";
import fs from "fs";
import path from "path";
import { treeSourceFromFileSystem } from "./treeSourceFromFileSystem";
import mdx from "@mdx-js/esbuild";
import handler from "serve-handler";
import http from "http";
import open from "open";
import { fileURLToPath } from "url";
import { TreeSourceNode } from "@vuu-ui/vuu-utils";

const pathToSrc = "./src/examples";

const examples = buildFileList(pathToSrc, /examples.tsx$/);
const mdxFiles = buildFileList(pathToSrc, /.mdx$/);
const features = buildFileList("./src/features", /feature.tsx$/);

// TODO use a separate build call for each theme, without bundling
const themes = ["./src/themes/salt-theme.ts", "./src/themes/vuu-theme-deprecated.ts"];

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const currentDir = path.dirname(__filename); // get the name of the directory
const showcaseIndex = path.join(currentDir, "../src/root.ts");

const outdir = ".showcase/prod";

const entryPoints = [showcaseIndex]
  .concat(examples)
  .concat(features)
  .concat(mdxFiles)
  .concat(themes);

const cssInlinePlugin = {
  name: "CssInline",
  setup(build) {
    build.onLoad(
      {
        filter:
          /packages\/(vuu|grid)-(context-menu|datatable|filters|layout|popups|shell|table-extras|ui-controls|table)\/.*.css$/,
      },
      async (args) => {
        const css = await fs.promises.readFile(args.path, "utf8");
        // css = await esbuild.transform(css, { loader: "css", minify: true });
        return { loader: "text", contents: css };
      },
    );
  },
};

// 2) Create the .showcase working directory
if (!fs.existsSync(".showcase/prod")) {
  createFolder(".showcase/prod");
}

const esbuildConfig = {
  entryPoints,
  env: "production",
  external: [
    "./themes/salt-theme.ts",
    "./themes/vuu-theme-deprecated.ts",
    "./themes/tar-theme.ts",
  ],
  name: "showcase",
  plugins: [cssInlinePlugin, mdx()],
  outdir: `${outdir}`,
  splitting: true,
  target: "esnext",
};

async function main() {
  console.log("[CLEAN]");
  // Create the deploy folder
  createFolder(outdir);

  console.log("[BUILD]");
  const [{ duration }] = await Promise.all([build(esbuildConfig)]).catch(
    (e) => {
      console.error(e);
      process.exit(1);
    },
  );

  const [treeSourceJson /*, tags*/] = treeSourceFromFileSystem(
    "./src/examples",
    "production",
  );
  await writeFile(
    `export default ${JSON.stringify(treeSourceJson)};`,
    path.resolve(outdir, "treeSourceJson.js"),
  );

  console.log(`\nbuild took ${formatDuration(duration)}`);

  // 2.3 create index.html
  const HTML_TEMPLATE = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Vuu Showcase</title>
    <link rel="stylesheet" href="/tools/vuu-showcase/src/root.css" />
    <script type="module">
      const { default: treeSource } = await import("/treeSourceJson.js");
      const { default: start } = await import(
        "/tools/vuu-showcase/src/root.js"
      );
      start(treeSource);
    </script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
  `;
  await writeFile(HTML_TEMPLATE, "./.showcase/prod/index.html");

  const rootPaths = joinRootPaths(treeSourceJson);
  const routingPattern = `/(${rootPaths})/**`;
  console.log({ routingPattern });

  const server = http.createServer((request, response) => {
    // You pass two more arguments for config and middleware
    // More details here: https://github.com/vercel/serve-handler#options
    return handler(request, response, {
      public: outdir,
      rewrites: [
        {
          source: "/themes/vuu-theme-deprecated.css",
          destination: "/showcase/src/themes/vuu-theme-deprecated.css",
        },
        {
          source: routingPattern,
          destination: "index.html",
        },
        {
          source: "/features/FilterTable.feature.css",
          destination: "/showcase/src/features/FilterTable.feature.css",
        },
        {
          source: "/features/FilterTable.feature.js",
          destination: "/showcase/src/features/FilterTable.feature.js",
        },
        {
          source: "/features/BasketTrading.feature.css",
          destination: "/showcase/src/features/BasketTrading.feature.css",
        },
        {
          source: "/features/BasketTrading.feature.js",
          destination: "/showcase/src/features/BasketTrading.feature.js",
        },
      ],
    });
  });

  await server.listen(4173, () => {
    console.log("Running at http://localhost:4173");
  });

  open("http://localhost:4173/");
}

main();

function joinRootPaths(treeNodes: TreeSourceNode[]) {
  return treeNodes.map(({ id }) => id).join("|");
}
