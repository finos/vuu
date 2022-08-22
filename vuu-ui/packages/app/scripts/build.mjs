import { build } from 'esbuild';
import { exec, formatBytes } from '../../../scripts/utils.mjs';

const entryPoints = [
  'src/index.jsx',
  // 'src/login.jsx',
  // 'src/features/filtered-grid/index.js',
  // 'src/features/metrics/index.js',
  'src/features/simple-component/index.js'
];

const outbase = 'src';
const outdir = 'public';

const stripOutdir = (file) => file.replace(RegExp(`^${outdir}\/`), '');

async function main() {
  const args = process.argv.slice(2);
  const watch = args.includes('--watch');
  const development = watch || args.includes('--dev');

  console.log('[CLEAN]');
  await exec("find -E public -regex '.*.(js|css)(.map)?$' -delete");

  try {
    console.log('[BUILD]');
    const { metafile } = await build({
      bundle: true,
      define: {
        'process.env.NODE_ENV': development ? `"development"` : `"production"`,
        'process.env.NODE_DEBUG': `false`
      },
      entryPoints,
      format: 'esm',
      loader: {
        '.woff2': 'dataurl'
      },
      metafile: true,
      minify: development !== true,
      outbase,
      outdir,
      sourcemap: true,
      splitting: true,
      watch
    }).catch(() => process.exit(1));

    console.log('[DEPLOY worker.js]');
    await exec('cp ../../node_modules/@vuu-ui/data-worker/worker.js ./public/worker.js');
    await exec('cp ../../node_modules/@vuu-ui/data-worker/worker.js.map ./public/worker.js.map');

    entryPoints.forEach((fileName) => {
      const outJS = `${outdir}/${fileName
        .replace(new RegExp(`^${outbase}\\/`), '')
        .replace(/x$/, '')}`;
      const outCSS = outJS.replace(/js$/, 'css');
      const {
        outputs: { [outJS]: jsOutput, [outCSS]: cssOutput }
      } = metafile;
      console.log(`\t${stripOutdir(outJS)}:  ${formatBytes(jsOutput.bytes)}`);
      if (cssOutput) {
        console.log(`\t${stripOutdir(outCSS)}: ${formatBytes(cssOutput.bytes)}`);
      }
    });
  } catch (error) {
    console.error(error);
    process.exit((error && error.code) || 1); // properly exit with error code (useful for CI or chaining)
  }
}

main();
