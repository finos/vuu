import shell from 'shelljs';
import { build } from './esbuild.mjs';

import fs from 'fs';
import { formatBytes, readPackageJson } from './utils.mjs';
const NO_DEPENDENCIES = {};
const DEFAULT_DIST_PATH = `../../dist`;

async function main() {
  const args = process.argv.slice(2);

  const packageJson = readPackageJson();
  const DIST_PATH = DEFAULT_DIST_PATH;

  const { name: scopedPackageName, peerDependencies = NO_DEPENDENCIES, version } = packageJson;

  const [, packageName] = scopedPackageName.split('/');

  const external = Object.keys(peerDependencies);

  const workerTS = 'src/worker.ts';
  const indexTS = 'src/index.ts';
  const indexJS = 'src/index.js';

  const outdir = `${DIST_PATH}/${packageName}`;
  const watch = args.includes('--watch');
  const development = watch || args.includes('--dev');

  const hasWorker = fs.existsSync(workerTS);
  const isTypeScript = fs.existsSync(indexTS);

  const buildConfig = {
    entryPoints: [isTypeScript ? indexTS : indexJS],
    env: development ? 'development' : 'production',
    external,
    outdir: `${DIST_PATH}/${packageName}`,
    name: scopedPackageName
  };

  const workerConfig = hasWorker
    ? {
        entryPoints: [workerTS],
        env: development ? 'development' : 'production',
        outdir: `${DIST_PATH}/${packageName}`,
        name: scopedPackageName
      }
    : undefined;

  function createDistFolder() {
    const path = `${DIST_PATH}/${packageName}`;
    shell.rm('-rf', path);
    shell.mkdir('-p', path);
  }

  const GeneratedFiles = /^(worker|index)\.(js|css)(\.map)?$/;

  async function writePackageJSON() {
    return new Promise((resolve, reject) => {
      const { files } = packageJson;
      if (files) {
        const filesToPublish = files.filter((fileName) => !GeneratedFiles.test(fileName));
        if (filesToPublish.length) {
          filesToPublish.forEach((fileName) => {
            const filePath = fileName.replace(/^\//, './');
            shell.cp('-r', filePath, `${outdir}`);
          });
        }
      }
      const newPackage = {
        ...packageJson,
        main: 'index.js',
        module: 'index.js',
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

  createDistFolder();

  const [, { metafile }, workerResult] = await Promise.all(
    [writePackageJSON(), build(buildConfig)].concat(hasWorker ? build(workerConfig) : [])
  ).catch((e) => {
    console.error(e);
    process.exit(1);
  });

  const {
    outputs: { [`${outdir}/index.js`]: jsOut, [`${outdir}/index.css}`]: cssOut }
  } = metafile;

  if (hasWorker) {
    const {
      outputs: { [`${outdir}/worker.js`]: workerOut }
    } = workerResult.metafile;
    console.log(`[${scopedPackageName}] DEPLOY worker.js to Showcase`);
    shell.cp(`${outdir}/worker.js`, '../showcase/public/VUU');
    shell.cp(`${outdir}/worker.js.map`, '../showcase/public/VUU');
    console.log(`[${scopedPackageName}@${version}] \tworker.js:  ${formatBytes(workerOut.bytes)}`);
  }
  if (jsOut) {
    console.log(`[${scopedPackageName}@${version}] \tindex.js:  ${formatBytes(jsOut.bytes)}`);
  }
  if (cssOut) {
    console.log(`[${scopedPackageName}@${version}] \tindex.css: ${formatBytes(cssOut.bytes)}`);
  }
}

main();
