import { build as esbuild } from "esbuild";

export async function build(config) {
  const start = process.hrtime();
  const {
    banner,
    entryPoints,
    env = "production",
    external,
    footer,
    format = "esm",
    jsx,
    outdir,
    outbase,
    outfile,
    sourcemap = true,
    splitting,
    target = ["es2020", "chrome79"],
    write = true,
  } = config;

  return esbuild({
    entryPoints,
    banner,
    bundle: true,
    define: {
      "process.env.NODE_ENV": `"${env}"`,
      "process.env.NODE_DEBUG": `false`,
      "process.env.LOCAL": `true`,
      "process.env.LAYOUT_BASE_URL": `"http://127.0.0.1:8081/api"`,
    },
    external,
    footer,
    format,
    jsx,
    loader: {
      ".woff": "file",
      ".woff2": "file",
      ".ttf": "file",
    },
    mainFields: ["module", "main"],
    metafile: true,
    minify: config.env === "production",
    outbase,
    outdir,
    outfile,
    sourcemap,
    splitting,
    target,
    write,
  })
    .then((result) => {
      const [seconds, nanoSeconds] = process.hrtime(start);
      return { result, duration: { seconds, nanoSeconds } };
    })
    .catch((err) => {
      console.error(`ERROR in [${config.name}] ${err.message}`);
      process.exit(1);
    });
}
