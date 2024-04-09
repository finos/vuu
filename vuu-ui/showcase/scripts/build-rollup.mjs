import { rollup } from "rollup";
import esbuild from "rollup-plugin-esbuild";
import css from "rollup-plugin-import-css";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";

import { createFolder } from "../../scripts/utils.mjs";
import { buildFileList } from "./build-file-list.mjs";
import fs from "fs";
import path from "path";

const indexFiles = buildFileList("./src/examples", /index.ts$/);
const examples = buildFileList("./src/examples", /examples.tsx$/);
const features = buildFileList("./src/features", /feature.tsx$/);

const entryPoints = ["src/main.tsx"]
  .concat(indexFiles)
  .concat(features)
  .concat(examples);

const HTML_TEMPLATE = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
      <link rel="manifest" href="/manifest.json">    
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="stylesheet" href="/index.css"/>
      <title>Vite Showcase</title>
    </head>
    <body>
      <div id="root"></div>
      <script type="module" src="/main.js"></script>
    </body>
  </html>
  `;

const outdir = "dist";

const inputOptions = {
  input: entryPoints,
  plugins: [
    nodeResolve({
      moduleDirectories: ["node_modules", "sample-apps"],
    }),
    commonjs(),
    json(),
    esbuild(),
    css({ output: "index.css" }),
    replace({
      preventAssignment: true,
      values: {
        "process.env.NODE_ENV": JSON.stringify("production"),
        "process.env.NODE_DEBUG": false,
        "process.env.LOCAL": true,
        "process.env.LAYOUT_BASE_URL": `"http://127.0.0.1:8081/api"`,
      },
    }),
  ],
};

// console.log(entryPoints);

const outputOptionsList = [
  {
    dir: `dist`,
    format: "es",
    preserveModules: true,
    sourcemap: true,
  },
];

const rollupConfig = {
  entryPoints,
  outdir,
};

function writeHtmlFile() {
  return new Promise((resolve, reject) => {
    fs.writeFile(path.resolve(outdir, "index.html"), HTML_TEMPLATE, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function build() {
  console.log("[BUILD]");
  const bundle = await rollup(inputOptions);
  await Promise.all(outputOptionsList.map(bundle.write));
  await bundle.close();
}

async function main() {
  console.log("[CLEAN]");
  // Create the deploy folder
  createFolder(outdir);

  console.log("[BUILD]");
  try {
    await build(rollupConfig);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  console.log("[DEPLOY public assets]");
  const publicContent = fs.readdirSync(`./public`);
  publicContent.forEach((file) => {
    if (file !== ".DS_Store") {
      fs.cp(
        path.resolve("public", file),
        path.resolve(outdir, file),
        { recursive: true },
        (err) => {
          if (err) throw err;
        }
      );
    }
  });

  await writeHtmlFile();
}

main();
