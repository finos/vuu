import fs from "fs";
import path from "path";
import { createFolder, getCommandLineArg, readPackageJson } from "./utils.mjs";

const defaultConfig = {
  distPath: `../../dist`,
  licencePath: "../../../LICENSE",
};

const indexDTS = "index.d.ts";

export default async function main(customConfig) {
  const config = {
    ...defaultConfig,
    ...customConfig,
  };

  const packageJson = readPackageJson();
  const { distPath: DIST_PATH, licencePath: LICENCE_PATH } = config;

  const { name: scopedPackageName } = packageJson;

  const [, packageName] = scopedPackageName.split("/");

  const jsonOutput = getCommandLineArg("--json");
  const outdir = `${DIST_PATH}/${packageName}`;

  async function writePackageJSON() {
    return new Promise((resolve, reject) => {
      const {
        // eslint-disable-next-line no-unused-vars
        main,
        // eslint-disable-next-line no-unused-vars
        scripts,
        types,
        ...packageRest
      } = packageJson;

      const files = [indexDTS];
      files.forEach((fileName) => {
        const filePath = fileName.replace(/^\//, "./");
        const outPath = `${outdir}/${fileName}`;
        fs.cp(filePath, outPath, { recursive: true }, (err) => {
          if (err) throw err;
        });
      });

      const newPackage = {
        ...packageRest,
        files,
      };

      newPackage.types = types;

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

  createFolder(outdir);

  // Compose the list of async tasks we are going to run
  const buildTasks = [];

  buildTasks.push(copyLicense());

  await Promise.all(buildTasks).catch((e) => {
    console.log(e.message);
    process.exit(1);
  });

  const jsonResult = jsonOutput ? { name: scopedPackageName } : undefined;
  if (!jsonOutput) {
    console.log(`[${scopedPackageName}]`);
  }

  await writePackageJSON();

  if (jsonOutput && jsonResult) {
    console.log(JSON.stringify(jsonResult));
  }
}
