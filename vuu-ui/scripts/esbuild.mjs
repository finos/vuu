import { build as esbuild } from 'esbuild';

export async function build(config) {
  const start = process.hrtime();
  return esbuild({
    entryPoints: config.entryPoints,
    bundle: true,
    define: {
      'process.env.NODE_ENV': `"${config.env}"`,
      'process.env.NODE_DEBUG': `false`
    },
    external: config.external,
    format: 'esm',
    loader: {
      '.woff2': 'dataurl'
    },
    metafile: true,
    minify: config.env === 'production',
    outdir: config.outdir,
    sourcemap: true,
    splitting: config.splitting,
    target: 'esnext',
    watch: false
  })
    .then((result) => {
      const [seconds, nanoSeconds] = process.hrtime(start);
      console.log(
        `[${config.name}] esbuild took ${seconds}s ${Math.round(nanoSeconds / 1_000_000)}ms`
      );
      return result;
    })
    .catch((err) => {
      console.error(`ERROR in [${config.name}] ${err.message}`);
      process.exit(1);
    });
}
