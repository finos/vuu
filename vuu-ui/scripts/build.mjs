import shell from "shelljs";
import { build } from "./esbuild.mjs";

import fs from "fs";
import path from "path";
import { formatBytes, formatDuration, readPackageJson } from "./utils.mjs";
const NO_DEPENDENCIES = {};

const defaultConfig = {
  distPath: `../../dist`,
  jsx: "transform",
  licencePath: "../../../LICENSE",
};

export default async function main(customConfig) {
  const args = process.argv.slice(2);

  const config = {
    ...defaultConfig,
    ...customConfig,
  };

  const packageJson = readPackageJson();
  const { distPath: DIST_PATH, licencePath: LICENCE_PATH } = config;

  const { name: scopedPackageName, peerDependencies = NO_DEPENDENCIES } =
    packageJson;

  const [, packageName] = scopedPackageName.split("/");

  const external = Object.keys(peerDependencies);

  const workerTS = "src/worker.ts";
  const indexTS = "src/index.ts";
  const indexJS = "src/index.js";
  const indexCSS = "index.css";

  const outdir = `${DIST_PATH}/${packageName}`;
  const watch = args.includes("--watch");
  const development = watch || args.includes("--dev");
  const cjs = args.includes("--cjs") ? " --cjs" : "";

  const hasWorker = fs.existsSync(workerTS);
  const isTypeScript = fs.existsSync(indexTS);
  const isJavaScript = fs.existsSync(indexJS);

  const buildConfig = {
    entryPoints: [isTypeScript ? indexTS : isJavaScript ? indexJS : indexCSS],
    env: development ? "development" : "production",
    external,
    outdir: `${outdir}/esm`,
    name: scopedPackageName,
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
    shell.rm("-rf", outdir);
    shell.mkdir("-p", outdir);
  }

  const GeneratedFiles = /^(worker|index)\.(js|css)(\.map)?$/;

  async function writePackageJSON() {
    return new Promise((resolve, reject) => {
      const { files, main, types, ...packageRest } = packageJson;
      if (files) {
        const filesToPublish = files.filter(
          (fileName) => !GeneratedFiles.test(fileName)
        );
        if (filesToPublish.length) {
          filesToPublish.forEach((fileName) => {
            const filePath = fileName.replace(/^\//, "./");
            shell.cp("-r", filePath, `${outdir}`);
          });
        }
      }
      const newPackage = {
        ...packageRest,
        files,
        module: "esm/index.js",
      };

      if (cjs) {
        newPackage.main = "cjs/index.js";
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

  async function copyStaticFiles() {
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

  function relocateCSSToPackageRoot() {
    if (cjs) {
      shell.rm(`${outdir}/cjs/index.css`);
      shell.rm(`${outdir}/cjs/index.css.map`);
    }
    shell.mv(`${outdir}/esm/index.css`, outdir);
    shell.mv(`${outdir}/esm/index.css.map`, outdir);
  }

  createDistFolder();

  if (hasWorker) {
    // this has to complete first, the inline worker will be consumed ny subsequent build
    await build(inlineWorkerConfig);
  }

  // Compose the list of async tasks we are going to run
  const buildTasks = [writePackageJSON(), build(buildConfig)];
  if (cjs) {
    buildTasks.push(
      build({
        ...buildConfig,
        format: "cjs",
        outdir: `${outdir}/cjs`,
      })
    );
  }
  buildTasks.push(copyStaticFiles());

  const [, esmOutput, cjsOutput] = await Promise.all(buildTasks).catch((e) => {
    console.error(e);
    process.exit(1);
  });

  const {
    outputs: {
      [`${outdir}/esm/index.js`]: jsOut,
      [`${outdir}/esm/index.css`]: cssOut,
    },
  } = esmOutput.result.metafile;

  console.log(`[${scopedPackageName}]`);

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
