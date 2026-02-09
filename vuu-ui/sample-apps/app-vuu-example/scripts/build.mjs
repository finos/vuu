import {
  assertFileExists,
  byFileName,
  copyFolderSync,
  formatBytes,
  formatDuration,
  getCommandLineArg,
  padRight,
  readJson,
  readPackageJson,
  writeMetaFile,
} from "../../../scripts/utils.mjs";
import { build } from "../../../scripts/esbuild.mjs";
import fs from "fs";
import path from "path";

const WS = "ws"; // to stop semGrep complaining
function assertWebsocketArgs(url, insecure) {
  if (url.startsWith(WS + "s://") && insecure) {
    console.warn(
      "WARN: Passed websocket url is secure. Ignoring `--insecure` flag.",
    );
  } else if (url.startsWith(WS + "://") && !insecure) {
    console.warn(
      `WARN: Use '--insecure' flag if websocket connection (${url}) is not secure.`,
    );
  }
}
function toWebsocketUrl(url, insecure) {
  if (!url) return;
  const websocketUrlRegex = new RegExp(`^${WS}[s]?://`);
  if (url.match(websocketUrlRegex)) {
    assertWebsocketArgs(url, insecure);
    return url;
  } else {
    return [WS, insecure ? "://" : "s://", url].join("");
  }
}

const entryPoints = ["index.tsx", "login.tsx"];

const outdir = "../../deployed_apps/app-vuu-example";
let configFile = "./config/localhost.config.json";

const insecure = !!getCommandLineArg("--insecure");
const websocketUrl = toWebsocketUrl(
  getCommandLineArg("--url", true, "wss://localhost:8090/websocket"),
  insecure,
);

const watch = getCommandLineArg("--watch");
const development = watch || getCommandLineArg("--dev");
const configPath = getCommandLineArg("--config", true);
const features = getCommandLineArg(
  "--features",
  true,
  "feature-filter-table,feature-instrument-tiles,feature-basket-trading",
);
if (configPath) {
  configFile = configPath;
}

const featureEntryPoints = features
  .split(",")
  .map((featureName) => `../${featureName}/index.ts`);

assertFileExists(configFile, true);

const { name: projectName } = readPackageJson();

console.log(`env = development ?  ${development}`);

const esbuildConfig = {
  entryPoints: entryPoints.concat(featureEntryPoints),
  env: development ? "development" : "production",
  name: "app-vuu-example",
  outdir,
  splitting: true,
  target: "esnext",
};

async function writeFeatureEntriesToConfigJson(featureBundles) {
  return new Promise((resolve, reject) => {
    console.log("[DEPLOY config]");
    const configJson = readJson(configFile);
    configJson.ssl = !insecure;
    if (websocketUrl) {
      configJson.websocketUrl = websocketUrl;
    }
    let { features } = configJson;
    if (features === undefined) {
      features = configJson.features = {};
    }

    /**
     * The JavaScript bundle is resolved by React from code running in the shell,
     * the relative path must reach up from within the main app bundle.
     * The CSS file is resolved by a call to fetch (until import assert works everywhere)
     * this is resolved relative to root.
     */
    const featureFilePath = (featureName, files, matchPattern) => {
      const file = files.find(({ fileName }) =>
        fileName.endsWith(matchPattern),
      );
      if (file && matchPattern === ".js") {
        return `../feature-${featureName}/${file.fileName}`;
      } else if (file && matchPattern === ".css") {
        return `./feature-${featureName}/${file.fileName}`;
      }
    };

    featureBundles.forEach(({ name, files }) => {
      const { description = name, vuu } = readJson(
        path.resolve(`../feature-${name}/package.json`),
      );
      features[name] = {
        title: description,
        name,
        url: featureFilePath(name, files, ".js"),
        css: featureFilePath(name, files, ".css"),
        ...vuu,
      };
    });

    fs.writeFile(
      path.resolve(outdir, "config.json"),
      JSON.stringify(configJson, null, 2),
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      },
    );
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
          },
        );
      } else {
        // delete once we no longer need to support node16 < .7
        copyFolderSync(
          path.resolve("public", file),
          path.resolve(outdir, file),
        );
      }
    }
  });

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
      } else if (fileName.startsWith("feature")) {
        const [name, featureFileName] = fileName.split("/");
        const featureName = name.replace("feature-", "");
        let feature = outputs.features.find((f) => f.name === featureName);
        if (feature === undefined) {
          feature = { name: featureName, files: [] };
          outputs.features.push(feature);
        }
        feature.files.push({ fileName: featureFileName, bytes });
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
  outputs.features.forEach(({ name, files }) => {
    console.log(`\nfeature: ${name}`);
    files.forEach(({ fileName, bytes }) => {
      console.log(`${padRight(fileName, 30)} ${formatBytes(bytes)}`);
    });
  });

  console.log(`\nbuild took ${formatDuration(duration)}`);

  await writeFeatureEntriesToConfigJson(outputs.features);
}

main();
