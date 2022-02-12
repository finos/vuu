import { build } from 'esbuild';
import { formatBytes, readPackageJson } from './utils.mjs';
const NO_DEPENDENCIES = {};

async function main() {
  const { name, peerDependencies = NO_DEPENDENCIES, version } = readPackageJson();
  const external = Object.keys(peerDependencies);

  const { metafile } = await build({
    entryPoints: ['./index.jsx'],
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
    outfile: 'public/index.js',
    target: 'esnext'
  }).catch(() => process.exit(1));

  const {
    outputs: { 'public/index.js': jsOutput, 'index.css': cssOutput }
  } = metafile;

  console.log(`\tindex.js:  ${formatBytes(jsOutput.bytes)}`);
  if (cssOutput) {
    console.log(`\tindex.css: ${formatBytes(cssOutput.bytes)}`);
  }
}

main();
