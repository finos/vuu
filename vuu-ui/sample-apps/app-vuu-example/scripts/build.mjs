import {
  assertFileExists,
  copyFolderSync,
  formatBytes,
  formatDuration,
} from "../../../scripts/utils.mjs";
import { build } from "../../../scripts/esbuild.mjs";
import fs from "fs";
import path from "path";

const entryPoints = ["index.tsx", "login.tsx"];

const featureEntryPoints = [
  // "src/features/ag-grid/index.ts",
  "../feature-filtered-grid/index.ts",
  // "src/features/metrics/index.js",
];

const outbase = "src";
const outdir = "../../deployed_apps/app-vuu-example";
let configFile = "./config/localhost.config.json";

const stripOutdir = (file) => file.replace(RegExp(`^${outdir}\/`), "");

const args = process.argv.slice(2);
const watch = args.includes("--watch");
const development = watch || args.includes("--dev");
const hasConfigPath = args.includes("--config");
if (hasConfigPath) {
  const switchIndex = args.indexOf("--config");
  const configPath = args[switchIndex + 1];
  if (assertFileExists(configPath, true)) {
    configFile = configPath;
  }
}

const mainConfig = {
  entryPoints: entryPoints.concat(featureEntryPoints),
  env: development ? "development" : "production",
  name: "app-vuu-example",
  outdir,
  splitting: true,
};

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
  ] = await Promise.all([build(mainConfig)]).catch((e) => {
    console.error(e);
    process.exit(1);
  });

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

  console.log("[DEPLOY config]");
  copyFolderSync(path.resolve(configFile), path.resolve(outdir, "config.json"));

  entryPoints.concat(featureEntryPoints).forEach((fileName) => {
    console.log({ fileName, outbase });
    const outJS = `${outdir}/${fileName
      .replace(new RegExp(`^${outbase}\\/`), "")
      .replace(/x$/, "")
      .replace(/ts$/, "js")}`;
    console.log({ outJS });
    const outCSS = outJS.replace(/js$/, "css");
    const {
      outputs: { [outJS]: jsOutput, [outCSS]: cssOutput },
    } = metafile;
    console.log({ outputs: metafile.outputs });
    console.log(
      `\t${stripOutdir(outJS)}:  ${formatBytes(
        jsOutput.bytes
      )} (${formatDuration(duration)})`
    );
    if (cssOutput) {
      console.log(`\t${stripOutdir(outCSS)}: ${formatBytes(cssOutput.bytes)}`);
    }
  });
}

main();
