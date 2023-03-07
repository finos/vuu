import { build } from "./esbuild.mjs";
import fs from "fs";
import path from "path";
import {
  copyFolderSync,
  formatBytes,
  formatDuration,
  getCommandLineArg,
  readPackageJson,
  updateVersionAndDependencies,
  writeMetaFile,
} from "./utils.mjs";
const NO_DEPENDENCIES = {};

const defaultConfig = {
  distPath: `../../dist`,
  jsx: "transform",
  licencePath: "../../../LICENSE",
};

const workerTS = "src/worker.ts";
const indexTS = "src/index.ts";
const indexDTS = "index.d.ts";
const indexJS = "src/index.js";
const indexCSS = "index.css";
const README = "README.md";

const getDefaultFilesToPublish = ({
  includeJS,
  includeCSS,
  includeCJS,
  includeDTS,
  includeReadme,
}) => {
  const filesToPublish = [];
  includeCJS && filesToPublish.push("cjs");
  includeJS && filesToPublish.push("esm");
  includeCSS && filesToPublish.push("index.css", "index.css.map");
  includeDTS && filesToPublish.push(indexDTS);
  includeReadme && filesToPublish.push(README);
  return filesToPublish;
};

export default async function main(customConfig) {
  const config = {
    ...defaultConfig,
    ...customConfig,
  };

  const packageJson = readPackageJson();
  const { distPath: DIST_PATH, licencePath: LICENCE_PATH, target } = config;

  const { name: scopedPackageName, peerDependencies = NO_DEPENDENCIES } =
    packageJson;

  const [, packageName] = scopedPackageName.split("/");
  const external = Object.keys(peerDependencies);

  const watch = getCommandLineArg("--watch");
  const debug = getCommandLineArg("--debug");
  const development = watch || debug || getCommandLineArg("--dev");
  const cjs = getCommandLineArg("--cjs") ? " --cjs" : "";
  const outdir = `${DIST_PATH}/${packageName}${debug ? "-debug" : ""}`;

  const hasWorker = fs.existsSync(workerTS);
  const hasReadme = fs.existsSync(README);
  const isTypeScript = fs.existsSync(indexTS);
  const isTypeLib = fs.existsSync(indexDTS);
  const isJavaScript = fs.existsSync(indexJS);

  const buildConfig = {
    entryPoints: [isTypeScript ? indexTS : isJavaScript ? indexJS : indexCSS],
    env: development ? "development" : "production",
    external,
    outdir: `${outdir}/esm`,
    name: scopedPackageName,
    target,
  };

  const inlineWorkerConfig = hasWorker
    ? {
        banner: { js: "export function InlinedWorker() {" },
        entryPoints: [workerTS],
        env: development ? "development" : "production",
        footer: { js: "}" },
        name: scopedPackageName,
        outfile: `src/inlined-worker.js`,
        sourcemap: false,
      }
    : undefined;

  function createDistFolder() {
    fs.rmSync(outdir, { recursive: true, force: true });
    fs.mkdirSync(outdir, { recursive: true });
  }

  const GeneratedFiles = /^(worker|index)\.(js|css)(\.map)|(esm)?$/;

  async function writePackageJSON(options) {
    return new Promise((resolve, reject) => {
      const {
        files = getDefaultFilesToPublish(options),
        // eslint-disable-next-line no-unused-vars
        main,
        // eslint-disable-next-line no-unused-vars
        scripts,
        types,
        ...packageRest
      } = packageJson;
      if (files) {
        const filesToPublish = isTypeLib
          ? [indexDTS]
          : files.filter((fileName) => !GeneratedFiles.test(fileName));
        if (filesToPublish.length) {
          filesToPublish.forEach((fileName) => {
            const filePath = fileName.replace(/^\//, "./");
            const outPath = `${outdir}/${fileName}`;
            if (typeof fs.cp === "function") {
              // node v16.7 +
              fs.cp(filePath, outPath, { recursive: true }, (err) => {
                if (err) throw err;
              });
            } else {
              // delete once we no longer need to support node16 < .7
              copyFolderSync(filePath, outPath);
            }
          });
        }
      }
      const newPackage = { ...packageRest, files };

      if (isTypeLib) {
        newPackage.types = types;
      } else {
        newPackage.module = "esm/index.js";
        if (cjs) {
          newPackage.main = "cjs/index.js";
        }
      }

      if (debug) {
        updateVersionAndDependencies(newPackage, {
          pattern: /^@finos\/vuu/,
          suffix: "-debug",
        });
      }

      fs.writeFile(
        `${outdir}/package.json`,
        JSON.stringify(newPackage, null, 2),
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async function copyLicense() {
    return fs.copyFile(
      path.resolve(LICENCE_PATH),
      path.resolve(outdir, "LICENSE"),
      (err) => {
        if (err) {
          console.log("error copying LICENSE", {
            err,
          });
        }
      }
    );
  }

  async function copyReadme() {
    return fs.copyFile(
      path.resolve(README),
      path.resolve(outdir, README),
      (err) => {
        if (err) {
          console.log("error copying README", {
            err,
          });
        }
      }
    );
  }

  function relocateCSSToPackageRoot() {
    if (cjs) {
      fs.rmSync(`${outdir}/cjs/index.css`);
      fs.rmSync(`${outdir}/cjs/index.css.map`);
    }
    fs.renameSync(`${outdir}/esm/index.css`, path.resolve(outdir, "index.css"));
    fs.renameSync(
      `${outdir}/esm/index.css.map`,
      path.resolve(outdir, "index.css.map")
    );
    // copy any font files
  }

  createDistFolder();

  if (hasWorker) {
    // this has to complete first, the inline worker will be consumed ny subsequent build
    await build(inlineWorkerConfig);
  }

  // Compose the list of async tasks we are going to run
  const buildTasks = [];
  // const buildTasks = [];
  if (!isTypeLib) {
    buildTasks.push(build(buildConfig));
    if (cjs) {
      buildTasks.push(
        build({
          ...buildConfig,
          format: "cjs",
          outdir: `${outdir}/cjs`,
        })
      );
    }
  }
  buildTasks.push(copyLicense());
  if (hasReadme) {
    buildTasks.push(copyReadme());
  }

  const [esmOutput, cjsOutput] = await Promise.all(buildTasks).catch((e) => {
    console.log(e.message);
    process.exit(1);
  });

  console.log(`[${scopedPackageName}]`);

  const jsOut = esmOutput?.result.metafile.outputs?.[`${outdir}/esm/index.js`];
  const cssOut =
    esmOutput?.result.metafile.outputs?.[`${outdir}/esm/index.css`];

  await writePackageJSON({
    includeCSS: cssOut !== undefined,
    includeJS: jsOut !== undefined,
    includeCJS: cjs && !isTypeLib,
    includeDTS: isTypeLib,
    includeReadme: hasReadme,
  });

  if (jsOut || cssOut) {
    await writeMetaFile(esmOutput.result.metafile, outdir);

    if (cssOut) {
      relocateCSSToPackageRoot();
      console.log(`    \tindex.css:     ${formatBytes(cssOut.bytes)}`);
    }

    if (jsOut) {
      console.log(
        `\tesm/index.js:  ${formatBytes(jsOut.bytes)} (${formatDuration(
          esmOutput.duration
        )})`
      );
    }

    if (cjs) {
      const {
        outputs: { [`${outdir}/cjs/index.js`]: jsOut },
      } = cjsOutput.result.metafile;

      if (jsOut) {
        console.log(
          `\tcjs/index.js:  ${formatBytes(jsOut.bytes)} (${formatDuration(
            cjsOutput.duration
          )})`
        );
      }
    }
  }
}
