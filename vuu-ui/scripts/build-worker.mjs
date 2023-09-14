import fs from "fs";
import { build } from "./esbuild.mjs";
import { getCommandLineArg } from "./utils.mjs";

const workerTS = "src/worker.ts";

const getConfig = (name, env, workerFile = workerTS) => ({
  entryPoints: [workerFile],
  env,
  name,
  outfile: `src/inlined-worker.js`,
  sourcemap: false,
  write: false,
});

export const buildWorker = async (packageName, filePath) => {
  const watch = getCommandLineArg("--watch");
  const debug = getCommandLineArg("--debug");
  const development = watch || debug || getCommandLineArg("--dev");

  const env = development ? "development" : "production";
  const config = getConfig(packageName, env, filePath);
  const { result } = await build(config);
  const [outputSource] = result.outputFiles;
  const escapedSource = outputSource.text.replaceAll(
    /[`$]/g,
    (match) => `\\${match}`
  );

  const fullSource =
    "export const workerSourceCode = `\n" + escapedSource + "\n`;";

  return new Promise((resolve, reject) => {
    fs.writeFile(outputSource.path, fullSource, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};
