import { build as esbuild } from 'esbuild';

export async function build(config) {
  const start = process.hrtime();
  return esbuild({
    entryPoints: config.entryPoints,
    banner: config.banner,
    bundle: true,
    define: {
      'process.env.NODE_ENV': `"${config.env}"`,
      'process.env.NODE_DEBUG': `false`
    },
    external: config.external,
    footer: config.footer,
    format: 'esm',
    loader: {
      '.woff2': 'dataurl'
    },
    metafile: true,
    minify: config.env === 'production',
    outdir: config.outdir,
    outfile: config.outfile,
    sourcemap: config.sourcemap ?? true,
    splitting: config.splitting,
    target: 'esnext',
    watch: false
  })
    .then((result) => {
      const [seconds, nanoSeconds] = process.hrtime(start);
      console.log(
        `[${config.name}] ${seconds}s ${Math.round(nanoSeconds / 1_000_000)}ms   (esbuild)`
      );
      return result;
    })
    .catch((err) => {
      console.error(`ERROR in [${config.name}] ${err.message}`);
      process.exit(1);
    });
}
