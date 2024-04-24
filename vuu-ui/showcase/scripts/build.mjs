import {
  createFolder,
  byFileName,
  formatBytes,
  formatDuration,
  padRight,
  readPackageJson,
  writeMetaFile,
} from "../../scripts/utils.mjs";
import { build } from "../../scripts/esbuild.mjs";
import { buildFileList } from "./build-file-list.mjs";
import fs from "fs";
import path from "path";

const indexFiles = buildFileList("./src/examples", /index.ts$/);
const examples = buildFileList("./src/examples", /examples.tsx$/);
const features = buildFileList("./src/features", /feature.tsx$/);

// TODO use a separate build call for each theme, without bundling
const themes = ["./src/themes/salt-theme.ts", "./src/themes/vuu-theme.ts"];

const entryPoints = ["src/main.tsx"]
  .concat(indexFiles)
  .concat(features)
  .concat(examples)
  .concat(themes);

const importedCssFiles = [
  "AppHeader",
  "Calendar",
  "ContextPanel",
  "ConnectionStatusIndicator",
  "ExpandoCombobox",
  "ExpandoInput",
  "FeatureList",
  "FilterBar",
  "FilterClause",
  "FilterClauseCombinator",
  "FilterEditor",
  "FilterInput",
  "FilterPill",
  "FilterPillMenu",
  "Flexbox",
  "LayoutList",
  "LayoutTile",
  "LeftNav",
  "LoginPanel",
  "SaveLayoutPanel",
  "sessionEditingForm",
  "shell",
  "SidePanel",
  "Splitter",
  "Tabstrip",
  "Tab",
  "ThemeSwitch",
];

const regexp = new RegExp(`(${importedCssFiles.join("|")}).css$`);

const cssInlinePlugin = {
  name: "CssInline",
  setup(build) {
    build.onLoad(
      {
        filter: regexp,
      },
      async (args) => {
        const css = await fs.promises.readFile(args.path, "utf8");
        // css = await esbuild.transform(css, { loader: "css", minify: true });
        return { loader: "text", contents: css };
      }
    );
  },
};

const HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="manifest" href="/manifest.json">    
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="/main.css"/>
    <title>Vite Showcase</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.js"></script>
  </body>
</html>
`;

const outdir = "dist";

const { name: projectName } = readPackageJson();

const esbuildConfig = {
  entryPoints,
  env: "production",
  name: "showcase",
  plugins: [cssInlinePlugin],
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
        resolve();
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
    console.log(`${padRight(fileName, 30)} ${formatBytes(bytes)}`);
  });
  console.log("\ncommon");
  outputs.common.forEach(({ fileName, bytes }) => {
    console.log(`${padRight(fileName, 30)} ${formatBytes(bytes)}`);
  });

  console.log(`\nbuild took ${formatDuration(duration)}`);
}

main();
