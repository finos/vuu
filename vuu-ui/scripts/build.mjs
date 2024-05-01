import { build } from "./esbuild.mjs";
import fs from "fs";
import path from "path";
import {
  copyFolderSync,
  createFolder,
  formatBytes,
  formatDuration,
  getCommandLineArg,
  readPackageJson,
  updateVersionAndDependencies,
  writeMetaFile,
} from "./utils.mjs";
import { buildExternals } from "./package-utils.mjs";
import { buildWorker } from "./build-worker.mjs";

const defaultConfig = {
  distPath: `../../dist`,
  jsx: "transform",
  licencePath: "../../../LICENSE",
};

const workerTS = "src/worker.ts";
const indexTS = "index.ts";
const indexSrcTS = "src/index.ts";
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

  const { name: scopedPackageName } = packageJson;

  const [, packageName] = scopedPackageName.split("/");
  const externals = buildExternals(packageJson);

  const includeLicense = getCommandLineArg("--license");
  const watch = getCommandLineArg("--watch");
  const debug = getCommandLineArg("--debug");
  const development = watch || debug || getCommandLineArg("--dev");
  const cjs = getCommandLineArg("--cjs") ? " --cjs" : "";
  const jsonOutput = getCommandLineArg("--json");
  const outdir = `${DIST_PATH}/${packageName}${debug ? "-debug" : ""}`;

  const FONT_FILES = ["*.woff", "*.woff2"];

  const hasWorker = fs.existsSync(workerTS);
  const hasReadme = fs.existsSync(README);
  const isTypeScriptSrc = fs.existsSync(indexSrcTS);
  const isTypeScript = fs.existsSync(indexTS);
  const isTypeLib = fs.existsSync(indexDTS);
  const isJavaScript = fs.existsSync(indexJS);
  const hasRootCss = fs.existsSync(indexCSS);

  const getEntryPoints = () => {
    const entryPoint = isTypeScriptSrc
      ? indexSrcTS
      : isTypeScript
      ? indexTS
      : isJavaScript
      ? indexJS
      : indexCSS;
    const entryPoints = [entryPoint];
    // We may have a top-level css as well as typescript (icons)
    if (hasRootCss && !entryPoint.endsWith(".css")) {
      entryPoints.push(indexCSS);
    }
    return entryPoints;
  };

  const buildConfig = {
    entryPoints: getEntryPoints(),
    env: development ? "development" : "production",
    external: externals.concat(FONT_FILES),
    outdir: `${outdir}/esm`,
    name: scopedPackageName,
    target,
  };

  const GeneratedFiles = /^((worker|index)\.(js|css))|((\.map)|(esm))$/;

  async function writePackageJSON(options) {
    return new Promise((resolve, reject) => {
      const {
        files: filesFromPackageJson,
        // eslint-disable-next-line no-unused-vars
        main,
        // eslint-disable-next-line no-unused-vars
        scripts,
        style: styleFromPackageJson,
        types,
        ...packageRest
      } = packageJson;

      let files = getDefaultFilesToPublish(options);

      let defaultStyle = undefined;

      if (filesFromPackageJson || isTypeLib) {
        const filesToPublish = isTypeLib
          ? [indexDTS]
          : filesFromPackageJson.filter(
              (fileName) => !GeneratedFiles.test(fileName)
            );
        files = filesToPublish.concat(files);
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

      const cssFile = files.find((f) => f.endsWith(".css"));
      if (cssFile) {
        defaultStyle = cssFile;
      }
      const style = styleFromPackageJson ?? defaultStyle;

      const exports = style
        ? {
            [style]: {
              require: style,
              import: style,
            },
          }
        : undefined;

      const newPackage = {
        ...packageRest,
        exports,
        files,
        style,
      };

      if (isTypeLib) {
        newPackage.types = types;
      } else if (options.includeJS) {
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

  createFolder(outdir);

  if (hasWorker) {
    // this has to complete first, the inline worker will be consumed ny subsequent build
    await buildWorker(scopedPackageName);
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

  if (includeLicense) {
    buildTasks.push(copyLicense());
  }
  if (hasReadme) {
    buildTasks.push(copyReadme());
  }

  const [esmOutput, cjsOutput] = await Promise.all(buildTasks).catch((e) => {
    console.log(e.message);
    process.exit(1);
  });

  const jsonResult = jsonOutput ? { name: scopedPackageName } : undefined;
  if (!jsonOutput) {
    console.log(`[${scopedPackageName}]`);
  }

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
      if (jsonResult) {
        jsonResult.css = formatBytes(cssOut.bytes);
      } else {
        console.log(`    \tindex.css:     ${formatBytes(cssOut.bytes)}`);
      }
    }

    if (jsOut) {
      if (jsonResult) {
        jsonResult.javascript = formatBytes(jsOut.bytes);
      } else {
        console.log(
          `\tesm/index.js:  ${formatBytes(jsOut.bytes)} (${formatDuration(
            esmOutput.duration
          )})`
        );
      }
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

  if (jsonOutput && jsonResult) {
    console.log(JSON.stringify(jsonResult));
  }
}
