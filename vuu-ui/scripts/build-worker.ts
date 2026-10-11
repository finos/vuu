import { type Rspack, rspack } from "@rsbuild/core";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const WORKER_ENTRY = "src/worker.ts";
const OUTPUT_FILE = "src/inlined-worker.js";

/**
 * Bundles the web worker in the current package (src/worker.ts) into a
 * single classic script and writes it to src/inlined-worker.js as an
 * exported string, so it can be loaded via a Blob url at runtime.
 */
export const buildWorker = async (
  _packageName?: string,
  workerFile = WORKER_ENTRY,
) => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vuu-worker-"));
  try {
    const compiler = rspack({
      context: process.cwd(),
      mode: "production",
      target: "webworker",
      devtool: false,
      entry: path.resolve(workerFile),
      output: {
        path: tmpDir,
        filename: "worker.js",
        asyncChunks: false,
      },
      resolve: {
        extensions: [".ts", ".tsx", ".js"],
        mainFields: ["module", "main"],
      },
      module: {
        parser: { javascript: { dynamicImportMode: "eager" } },
        rules: [
          {
            test: /\.tsx?$/,
            loader: "builtin:swc-loader",
            options: {
              jsc: {
                parser: { syntax: "typescript", tsx: true },
                target: "es2020",
              },
            },
            type: "javascript/auto",
          },
        ],
      },
      optimization: {
        // No compression or mangling, the minimizer is used to strip comments
        minimize: true,
        minimizer: [
          new rspack.SwcJsMinimizerRspackPlugin({
            minimizerOptions: {
              compress: false,
              mangle: false,
              format: { comments: false },
            },
          }),
        ],
        nodeEnv: "development",
        splitChunks: false,
      },
      plugins: [new rspack.DefinePlugin({ "process.env.NODE_DEBUG": "false" })],
    });

    const stats = await new Promise<Rspack.Stats | undefined>(
      (resolve, reject) =>
        compiler.run((err, stats) => {
          compiler.close(() => {
            if (err) reject(err);
            else resolve(stats);
          });
        }),
    );
    if (stats?.hasErrors()) {
      throw Error(stats.toString({ all: false, errors: true }));
    }

    const source = await fs.readFile(path.join(tmpDir, "worker.js"), "utf8");
    await fs.writeFile(
      path.resolve(OUTPUT_FILE),
      `export const workerSourceCode = ${JSON.stringify(source)};\n`,
    );
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
};

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  buildWorker().catch((err) => {
    console.error(`[build-worker] ${err.message ?? err}`);
    process.exit(1);
  });
}
