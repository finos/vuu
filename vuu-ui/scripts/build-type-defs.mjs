import fs from "fs";
import { readPackageJson } from "./utils.mjs";
import { execWait, getCommandLineArg } from "./utils.mjs";

const packageJson = readPackageJson();
const { name: scopedPackageName } = packageJson;
const [, packageName] = scopedPackageName.split("/");
const debug = getCommandLineArg("--debug");
const packageNameSuffix = debug ? "-debug" : "";

const DIST_PATH = `../../dist`;
const outdir = `${DIST_PATH}/${packageName}${packageNameSuffix}`;
// A local ts config that we will write to the working directory,
// then remove when we're done. It specifies the output directory
// so will vary by package. Most of the config is defined at workspace
// level, the local file extends that one.
const tsConfigFile = `./tsconfig-emit-types.json`;

const writeProjectTsConfig = async () => {
  return new Promise((resolve, reject) => {
    const config = {
      extends: "../../tsconfig-emit-types.json",
      compilerOptions: {
        outDir: `${outdir}/types`,
      },
      include: ["src", "../../global.d.ts"],
    };

    fs.writeFile(tsConfigFile, JSON.stringify(config, null, 2), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

async function createTypeDefs() {
  await writeProjectTsConfig();
  await execWait(`tsc --project ${tsConfigFile}`);
  fs.rmSync(tsConfigFile);
}

function writePackageJSON() {
  return new Promise((resolve, reject) => {
    const packageJson = readPackageJson(`${outdir}/package.json`);
    const newPackage = {
      ...packageJson,
      files: (packageJson.files || []).concat("/types"),
      exports: {
        ...packageJson.exports,
        ".": {
          ...packageJson.exports["."],
          types: "./types/index.d.ts",
        },
      },
      types: "types/index.d.ts",
    };
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

await createTypeDefs();
await writePackageJSON();
console.log(`typedefs created ${scopedPackageName}`);
