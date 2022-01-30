const { build } = require('esbuild');
const { exec, formatBytes, readPackageJson } = require('./utils');
const { cyan } = require('kleur');
const NO_DEPENDENCIES = {};

async function main() {
  const args = process.argv.slice(2);

  const { name, peerDependencies = NO_DEPENDENCIES, version } = readPackageJson();
  const external = Object.keys(peerDependencies);
  const currentPath = process.cwd();
  const isWorker = currentPath.endsWith('data-worker');

  const outfile = isWorker ? 'worker.js' : 'index.js';
  const watch = args.includes('--watch');

  const { metafile } = await build({
    entryPoints: ['src/index.js'],
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
    await exec('cp ./worker.js ../../stories/public/worker.js');
    await exec('cp ./worker.js.map ../../stories/public/worker.js.map');
  }

  console.log(`${cyan(name)}@${version}`);
  console.log(`\t${outfile}:  ${formatBytes(jsOutput.bytes)}`);
  if (cssOutput) {
    console.log(`\tindex.css: ${formatBytes(cssOutput.bytes)}`);
  }
}

main();
