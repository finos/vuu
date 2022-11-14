import {
  assertFileExists,
  assertFolderExists,
  readJson,
  readPackageJson,
  formatBytes,
  formatDuration,
} from "./utils.mjs";
import { build } from "./esbuild.mjs";
import fs from "fs";
import path from "path";

const entryPoints = ["src/index.ts"];

const outbase = "src";
let outdir = "../../deployed_apps/app-vuu-example";
let configPath = `${outdir}/config.json`;

const stripOutdir = (file) => file.replace(RegExp(`^${outdir}\/`), "");

const args = process.argv.slice(2);
const watch = args.includes("--watch");
const development = watch || args.includes("--dev");

const hasDeployPath = args.includes("--deploy");
if (hasDeployPath) {
  const switchIndex = args.indexOf("--deploy");
  const deployPath = args[switchIndex + 1];
  outdir = deployPath;
}

const packageJson = readPackageJson();
const { name: featureName } = packageJson;

if (assertFolderExists(outdir, true)) {
  outdir = `${outdir}/features/${featureName}`;
  assertFileExists(configPath, true);
}

const mainConfig = {
  entryPoints: entryPoints,
  env: development ? "development" : "production",
  name: featureName,
  outdir,
  splitting: true,
};

async function writeConfigJSON({ js, css }) {
  return new Promise((resolve, reject) => {
    const configJson = readJson(configPath);
    let { features } = configJson;
    if (features === undefined) {
      features = configJson.features = {};
    }
    features[featureName] = {
      id: featureName,
      url: `./features/${featureName}/${js}`,
      css: css ? `./features/${featureName}/${css}` : undefined,
    };

    fs.writeFile(configPath, JSON.stringify(configJson, null, 2), (err) => {
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

  console.log(`[BUILD] . deploying to ${path.resolve(outdir)}`);
  const [
    {
      result: { metafile },
      duration,
    },
  ] = await Promise.all([build(mainConfig)]).catch((e) => {
    console.error(e);
    process.exit(1);
  });

  console.log("[WRITE FEATURE DETAILS TO CONFIG]");

  const [fileName] = entryPoints;
  const outJS = `${outdir}/${fileName
    .replace(new RegExp(`^${outbase}\\/`), "")
    .replace(/x$/, "")
    .replace(/ts$/, "js")}`;
  const featureFiles = {
    js: "index.js",
  };
  const outCSS = outJS.replace(/js$/, "css");
  const {
    outputs: { [outJS]: jsOutput, [outCSS]: cssOutput },
  } = metafile;
  console.log(
    `\t${stripOutdir(outJS)}:  ${formatBytes(jsOutput.bytes)} (${formatDuration(
      duration
    )})`
  );
  if (cssOutput) {
    console.log(`\t${stripOutdir(outCSS)}: ${formatBytes(cssOutput.bytes)}`);
    featureFiles.css = "index.css";
  }
  await writeConfigJSON(featureFiles);
}

main();
