import fs from "fs";
import { readPackageJson } from "./utils.mjs";
import { exec } from "child_process";
import { execWait } from "./utils.mjs";

const packageJson = readPackageJson();
const { name: scopedPackageName } = packageJson;
const [, packageName] = scopedPackageName.split("/");

const DIST_PATH = `../../dist`;
const outdir = `${DIST_PATH}/${packageName}`;

async function createTypeDefs() {
  execWait("tsc --project ./tsconfig-emit-types.json");
}

function writePackageJSON() {
  return new Promise((resolve, reject) => {
    const packageJson = readPackageJson(`${outdir}/package.json`);
    const newPackage = {
      ...packageJson,
      files: (packageJson.files || []).concat("/types"),
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

createTypeDefs();
await writePackageJSON();
