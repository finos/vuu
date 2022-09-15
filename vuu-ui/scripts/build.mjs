import shell from 'shelljs';
import { build } from 'esbuild';

import fs from 'fs';
import { formatBytes, readPackageJson } from './utils.mjs';
const NO_DEPENDENCIES = {};

async function main() {
  const args = process.argv.slice(2);

  const packageJson = readPackageJson();

  const { name: scopedPackageName, peerDependencies = NO_DEPENDENCIES, version } = packageJson;

  const [, packageName] = scopedPackageName.split('/');

  const external = Object.keys(peerDependencies);

  const workerTS = 'src/worker.ts';
  const indexTS = 'src/index.ts';
  const indexJS = 'src/index.js';

  const DIST_PATH = `../../dist`;
  const outdir = `${DIST_PATH}/${packageName}`;
  const watch = args.includes('--watch');
  const development = watch || args.includes('--dev');

  const isWorker = fs.existsSync(workerTS);
  const isTypeScript = !isWorker && fs.existsSync(indexTS);

  function createDistFolder() {
    const path = `${DIST_PATH}/${packageName}`;
    shell.rm('-rf', path);
    shell.mkdir('-p', path);
  }

  async function esbuild() {
    const start = process.hrtime();
    return build({
      entryPoints: [isWorker ? workerTS : isTypeScript ? indexTS : indexJS],
      bundle: true,
      define: {
        'process.env.NODE_ENV': development ? `"development"` : `"production"`,
        'process.env.NODE_DEBUG': `false`
      },
      external,
      format: 'esm',
      loader: {
        '.woff2': 'dataurl'
      },
      metafile: true,
      minify: development !== true,
      // outfile,
      outdir,
      target: 'esnext',
      sourcemap: true,
      watch
    }).then((result) => {
      const [seconds, nanoSeconds] = process.hrtime(start);
      console.log(
        `[${scopedPackageName}] esbuild took ${seconds}s ${Math.round(nanoSeconds / 1_000_000)}ms`
      );
      return result;
    });
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

  const [{ metafile }] = await Promise.all([esbuild(), writePackageJSON()]).catch((e) => {
    console.error(e);
    process.exit(1);
  });

  const {
    outputs: {
      [`${outdir}/index.js`]: jsOut,
      [`${outdir}/worker.js`]: workerOut,
      [`${outdir}/index.css}`]: cssOut
    }
  } = metafile;

  if (isWorker) {
    console.log(`[${scopedPackageName}] DEPLOY worker.js to Showcase`);
    shell.cp(`${outdir}/worker.js`, '../showcase/public/VUU');
    shell.cp(`${outdir}/worker.js.map`, '../showcase/public/VUU');
  }
  if (jsOut) {
    console.log(`\n[${scopedPackageName}@${version}] \tindex.js:  ${formatBytes(jsOut.bytes)}`);
  }
  if (workerOut) {
    console.log(
      `\n[${scopedPackageName}@${version}] \tworker.js:  ${formatBytes(workerOut.bytes)}`
    );
  }

  if (cssOut) {
    console.log(`[${scopedPackageName}@${version}] \tindex.css: ${formatBytes(cssOut.bytes)}`);
  }
}

main();
