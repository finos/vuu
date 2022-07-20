import { build } from 'esbuild';
import fs from 'fs';
import { exec, formatBytes, readPackageJson } from './utils.mjs';
const NO_DEPENDENCIES = {};

async function main() {
  const args = process.argv.slice(2);

  const { peerDependencies = NO_DEPENDENCIES, version } = readPackageJson();
  const external = Object.keys(peerDependencies);
  const currentPath = process.cwd();
  const isWorker = currentPath.endsWith('data-worker');

  const indexTS = 'src/index.ts';
  const indexJS = 'src/index.js';

  const outfile = isWorker ? 'worker.js' : 'index.js';
  const watch = args.includes('--watch');
  const isTypeScript = fs.existsSync(indexTS);

  const { metafile } = await build({
    entryPoints: [isTypeScript ? indexTS : indexJS],
    bundle: true,
    define: {
      'process.env.NODE_ENV': `"production"`,
      'process.env.NODE_DEBUG': `false`
    },
    external,
    format: 'esm',
    loader: {
      '.woff2': 'dataurl'
    },
    metafile: true,
    minify: true,
    outfile,
    target: 'esnext',
    sourcemap: true,
    watch
  }).catch(() => process.exit(1));

  const {
    outputs: { [outfile]: jsOutput, 'index.css': cssOutput }
  } = metafile;

  if (isWorker) {
    console.log('[DEPLOY worker.js]');
    await exec('cp ./worker.js ../showcase/public/VUU/worker.js');
    await exec('cp ./worker.js.map ../showcase/public/VUU/worker.js.map');
  }

  console.log(`@${version}`);
  console.log(`\t${outfile}:  ${formatBytes(jsOutput.bytes)}`);
  if (cssOutput) {
    console.log(`\tindex.css: ${formatBytes(cssOutput.bytes)}`);
  }
}

main();
