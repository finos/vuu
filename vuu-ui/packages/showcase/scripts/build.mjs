import xdm from 'xdm/esbuild.js';
import { build } from 'esbuild';

(async function () {
  try {
    console.log('[BUILD]');
    await build({
      entryPoints: ['src/index.jsx'],
      bundle: true,
      define: {
        'process.env.NODE_ENV': `"development"`,
        'process.env.NODE_DEBUG': `false`
      },
      format: 'esm',
      loader: {
        '.woff2': 'dataurl'
      },
      // minify: true,
      outfile: 'public/index.js',
      plugins: [
        xdm({
          /* Other options… */
        })
      ],
      sourcemap: true
      // watch: {
      //   onRebuild(error, result) {
      //     if (error) console.error('watch build failed:', error);
      //     else console.log('watch build succeeded:', result);
      //   }
      // }
    }).catch(() => process.exit(1));
  } catch (error) {
    console.error(error);
    process.exit((error && error.code) || 1); // properly exit with error code (useful for CI or chaining)
  }
})();
