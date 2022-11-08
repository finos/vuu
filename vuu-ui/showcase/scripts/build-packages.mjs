import { build } from 'esbuild';
import { formatBytes, readPackageJson } from './utils.mjs';
const NO_DEPENDENCIES = {};

async function main() {
  const { peerDependencies = NO_DEPENDENCIES } = readPackageJson();
  const external = Object.keys(peerDependencies);

  const { metafile } = await build({
    entryPoints: ['src/index.jsx'],

    // entryPoints: [
    //   'src/examples/UIControls/Button.stories.jsx',
    //   'src/examples/UIControls/List.stories.jsx'
    // ],
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
    // minify: true,
    outdir: 'public/packages',
    splitting: true,
    target: 'esnext'
  }).catch(() => process.exit(1));

  console.log(metafile);
  const {
    outputs: { 'public/index.js': jsOutput, 'index.css': cssOutput }
  } = metafile;

  console.log(`\tindex.js:  ${formatBytes(jsOutput.bytes)}`);
  if (cssOutput) {
    console.log(`\tindex.css: ${formatBytes(cssOutput.bytes)}`);
  }
}

main();
