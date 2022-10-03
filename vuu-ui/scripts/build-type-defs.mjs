import shell from 'shelljs';
import fs from 'fs';
import { readPackageJson } from './utils.mjs';

const packageJson = readPackageJson();
const { name: scopedPackageName, version } = packageJson;
const [, packageName] = scopedPackageName.split('/');

const DIST_PATH = `../../dist`;
const outdir = `${DIST_PATH}/${packageName}`;

async function createTypeDefs() {
  const start = process.hrtime();
  shell.exec('tsc --project ./tsconfig-emit-types.json');
  const [seconds, nanoSeconds] = process.hrtime(start);
  console.log(
    `[${packageName}@${version}] tsc typedefs took ${seconds}s ${Math.round(
      nanoSeconds / 1_000_000
    )}ms`
  );
}

function writePackageJSON() {
  return new Promise((resolve, reject) => {
    const packageJson = readPackageJson(`${outdir}/package.json`);
    console.log(JSON.stringify(packageJson));
    const newPackage = {
      ...packageJson,
      files: (packageJson.files || []).concat('/types'),
      types: 'types/index.d.ts'
    };
    fs.writeFile(`${outdir}/package.json`, JSON.stringify(newPackage, null, 2), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

createTypeDefs();
await writePackageJSON();
