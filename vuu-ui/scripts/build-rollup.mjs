import fs from "fs";
import path from "path";
import { rollup } from "rollup";
import esbuild from "rollup-plugin-esbuild";
import css from "rollup-plugin-import-css";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

import {
  createFolder,
  readPackageJson,
  formatBytes,
  padRight,
} from "./utils.mjs";
import { buildExternals } from "./package-utils.mjs";

const outdir = "../../dist";
const README = "README.md";
const LICENCE_PATH = "../../../LICENSE";

const inputOptions = {
  input: `src/index.ts`,
  plugins: [commonjs(), nodeResolve(), css(), json(), esbuild()],
};

async function copyLicense(outdir) {
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

const outputOptionsList = [
  {
    dir: `esm`,
    format: "es",
    preserveModules: true,
    sourcemap: true,
  },
  {
    dir: `cjs`,
    format: "cjs",
    preserveModules: true,
    sourcemap: true,
  },
];

const JsxRuntime = "react/jsx-runtime";

async function writePackageJSON(packageJson) {
  return new Promise((resolve, reject) => {
    const {
      files: filesFromPackageJson = [],
      // eslint-disable-next-line no-unused-vars
      main,
      name: scopedPackageName,
      // eslint-disable-next-line no-unused-vars
      scripts,
      style,
      ...packageRest
    } = packageJson;

    const [, packageName] = scopedPackageName.split("/");

    const files = [README];

    const filesToPublish = filesFromPackageJson.concat(files);
    filesToPublish.forEach((fileName) => {
      const filePath = fileName.replace(/^\//, "./");
      const outPath = `${outdir}/${packageName}/${fileName}`;
      fs.cp(filePath, outPath, { recursive: true }, (err) => {
        if (err) throw err;
      });
    });

    const exports = {
      ".": {
        require: "./cjs/index.js",
        import: "./esm/index.js",
      },
    };

    if (style) {
      exports[style] = {
        require: style,
        import: style,
      };
    }

    const newPackage = {
      ...packageRest,
      files: filesToPublish.concat(["esm", "cjs"]),
      exports,
      main: "cjs/index.js",
      module: "esm/index.js",
      name: scopedPackageName,
      style,
      type: "module",
    };

    fs.writeFile(
      `${outdir}/${packageName}/package.json`,
      JSON.stringify(newPackage, null, 2),
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
    copyLicense(`${outdir}/${packageName}`);
  });
}

async function writeFileFromBundle(bundle, options) {
  const { output } = await bundle.write(options);
  let javascriptSize = 0;
  let cssSize = 0;
  let cssInlineSize = 0;
  output.forEach(({ type, code, fileName, source }) => {
    if (type === "chunk") {
      if (fileName.endsWith(".css.js")) {
        cssInlineSize += code.length;
      } else {
        javascriptSize += code.length;
      }
    } else if (fileName.endsWith(".css")) {
      cssSize += source.length;
    }
  });

  console.log(`\n\tbundle size ${options.format}`);
  console.log(
    `\t\t${padRight("JavaScript", 30)}${formatBytes(javascriptSize)}`
  );
  console.log(
    `\t\t${padRight("CSS", 30)}${formatBytes(
      cssSize + cssInlineSize
    )}   (${formatBytes(cssInlineSize)} injected)`
  );

  return { javascriptSize, cssSize, cssInlineSize };
}

export default async function main() {
  try {
    const packageJson = readPackageJson();
    const { name: scopedPackageName } = packageJson;
    const [, packageName] = scopedPackageName.split("/");

    // const hasWorker = fs.existsSync(workerTS);

    const outPath = `${outdir}/${packageName}`;

    createFolder(outPath);

    const bundle = await rollup({
      ...inputOptions,
      external: buildExternals(packageJson).concat(JsxRuntime),
    });
    // await Promise.all(outputOptionsList.map(bundle.write));
    console.log(`\n${scopedPackageName}`);
    await Promise.all(
      outputOptionsList.map((options) => writeFileFromBundle(bundle, options))
    );

    await bundle.close();

    fs.renameSync("esm", `${outPath}/esm`);
    fs.renameSync("cjs", `${outPath}/cjs`);

    writePackageJSON(packageJson);
  } catch (error) {
    console.error(error);
  }
}
