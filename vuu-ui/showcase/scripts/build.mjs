import {
  byFileName,
  copyFolderSync,
  formatBytes,
  formatDuration,
  padRight,
  readPackageJson,
  writeMetaFile,
} from "../../scripts/utils.mjs";
import { build } from "../../scripts/esbuild.mjs";
import fs from "fs";
import path from "path";

const entryPoints = [
  "src/index.tsx",
  "src/features/BasketTrading.feature.tsx",
  "src/features/FilterTable.feature.tsx",
  "src/features/InstrumentTiles.feature.tsx",
  "src/features/Test.feature.tsx",
  "src/features/VuuBlotterMockData.feature.tsx",
  "src/features/TableNext.feature.tsx",
  // TODO automate addition of all example files
  "src/examples/Table/TableArrayData.examples.tsx",
  "src/examples/Table/TableVuuData.examples.tsx",
  "src/examples/html/HtmlTable.examples.tsx",
  "src/examples/Apps/index.ts",
];

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
    <script type="module" src="/index.js"></script>
  </body>
</html>
`;

const outdir = "dist";

const { name: projectName } = readPackageJson();

const esbuildConfig = {
  entryPoints,
  env: "production",
  name: "showcase",
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
  function createDeployFolder() {
    fs.rmSync(outdir, { recursive: true, force: true });
    fs.mkdirSync(outdir, { recursive: true });
  }

  console.log("[CLEAN]");
  createDeployFolder();

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
      if (typeof fs.cp === "function") {
        // node v16.7 +
        fs.cp(
          path.resolve("public", file),
          path.resolve(outdir, file),
          { recursive: true },
          (err) => {
            if (err) throw err;
          }
        );
      } else {
        // delete once we no longer need to support node16 < .7
        copyFolderSync(
          path.resolve("public", file),
          path.resolve(outdir, file)
        );
      }
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
