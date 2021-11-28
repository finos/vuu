import { build } from 'esbuild';
import { formatBytes, readPackageJson } from './utils.mjs';
import kleur from 'kleur';

const entryPoints = ['./index.jsx', 'features/simple-component.js'];
const outdir = 'public';

async function main() {
  const { name, version } = readPackageJson();

  const { metafile } = await build({
    entryPoints,
    bundle: true,
    define: {
      'process.env.NODE_ENV': `"production"`
    },
    format: 'esm',
    loader: {
      '.woff2': 'dataurl'
    },
    metafile: true,
    minify: true,
    outdir,
    sourcemap: true,
    splitting: true,
    target: 'esnext'
  }).catch(() => process.exit(1));

  const {
    outputs: { 'public/index.js': jsOutput, 'public/index.css': cssOutput }
  } = metafile;

  console.log(`${kleur.cyan(name)}@${version}`);
  console.log(`\tindex.js:  ${formatBytes(jsOutput.bytes)}`);
  if (cssOutput) {
    console.log(`\tindex.css: ${formatBytes(cssOutput.bytes)}`);
  }
}

main();
