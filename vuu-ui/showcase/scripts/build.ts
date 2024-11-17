import {
  createFolder,
  byFileName,
  formatBytes,
  formatDuration,
  padRight,
  readPackageJson,
  writeFile,
  writeMetaFile,
} from "../../scripts/utils.mjs";
import { build } from "../../scripts/esbuild.mjs";
import { buildFileList } from "./build-file-list.mjs";
import fs from "fs";
import path from "path";
import { treeSourceFromFileSystem } from "./treeSourceFromFileSystem";
import mdx from "@mdx-js/esbuild";

const indexFiles = buildFileList("./src/examples", /index.ts$/);
const examples = buildFileList("./src/examples", /examples.tsx$/);
const mdxFiles = buildFileList("./src/examples", /.mdx$/);
const features = buildFileList("./src/features", /feature.tsx$/);

console.log({ mdxFiles });

// TODO use a separate build call for each theme, without bundling
const themes = ["./src/themes/salt-theme.ts", "./src/themes/vuu-theme.ts"];

const entryPoints = ["src/index-main.tsx", "src/index-standalone.tsx"]
  .concat(indexFiles)
  .concat(features)
  .concat(examples)
  .concat(mdxFiles)
  .concat(themes);

const cssInlinePlugin = {
  name: "CssInline",
  setup(build) {
    build.onLoad(
      {
        filter:
          /packages\/vuu-(datatable|filters|layout|popups|shell|table"table-extras|ui-controls|table)\/.*.css$/,
      },
      async (args) => {
        const css = await fs.promises.readFile(args.path, "utf8");
        // css = await esbuild.transform(css, { loader: "css", minify: true });
        return { loader: "text", contents: css };
      },
    );
  },
};

const HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <base href="/" />
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="/index-main.css"/>
    <title>Vite Showcase</title>
    <script type="module">
      const hasUrlParameter = (paramName) => new URL(document.location.href).searchParams.has(paramName);
      const { default: treeSource } = await import(
        "/treeSourceJson.js"
      );
      if (hasUrlParameter("standalone")) {
        const { default: start } = await import("/index-standalone.js");
        start(treeSource);
      } else {
        const { default: start } = await import("/index-main.js");
        start(treeSource);
      }
    </script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;

const outdir = "dist";

const { name: projectName } = readPackageJson();

const esbuildConfig = {
  entryPoints,
  env: "production",
  external: [
    "./themes/salt-theme.ts",
    "./themes/vuu-theme.ts",
    "./themes/tar-theme.ts",
  ],
  name: "showcase",
  plugins: [cssInlinePlugin, mdx()],
  outdir,
  splitting: true,
  target: "esnext",
};

function writeHtmlFile() {
  return new Promise((resolve, reject) => {
    fs.writeFile(path.resolve(outdir, "index.html"), HTML_TEMPLATE, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(undefined);
      }
    });
  });
}

async function main() {
  console.log("[CLEAN]");
  // Create the deploy folder
  createFolder(outdir);

  console.log("[BUILD]");
  const [
    {
      result: { metafile },
      duration,
    },
  ] = await Promise.all([build(esbuildConfig)]).catch((e) => {
    console.error(e);
    process.exit(1);
  });

  await writeMetaFile(metafile, outdir);

  const treeSourceJson = treeSourceFromFileSystem("./src/examples", "");
  await writeFile(
    `export default ${JSON.stringify(treeSourceJson)};`,
    path.resolve(outdir, "treeSourceJson.js"),
  );

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
        },
      );
    }
  });

  await writeHtmlFile();

  const outputs = {
    core: [],
    common: [],
    features: [],
  };
  for (const [file, { bytes }] of Object.entries(metafile.outputs)) {
    if (file.endsWith("js") || file.endsWith("css")) {
      const fileName = file.replace(`${outdir}/`, "");
      if (fileName.startsWith(projectName)) {
        outputs.core.push({ fileName, bytes });
      } else {
        outputs.common.push({ fileName, bytes });
      }
    }
  }

  console.log("\ncore");
  outputs.core.sort(byFileName).forEach(({ fileName, bytes }) => {
    console.log(`${padRight(fileName, 90)} ${formatBytes(bytes)}`);
  });
  console.log("\ncommon");
  outputs.common.forEach(({ fileName, bytes }) => {
    console.log(`${padRight(fileName, 90)} ${formatBytes(bytes)}`);
  });

  console.log(`\nbuild took ${formatDuration(duration)}`);
}

main();
