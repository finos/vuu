import path from "path";
import { execWait, getCommandLineArg } from "./utils.mjs";
import chalk from "chalk";
import open from "open";

const packageName = getCommandLineArg("--package", true);

if (!packageName) {
  console.error(
    chalk.red.bold(
      "Package name must be specified with command, e.g.\n --package vuu-data "
    )
  );
  process.exit(1);
}

await execWait(
  `esbuild-visualizer --metadata ./dist/${packageName}/meta.json --filename ./dist/${packageName}/bundle.html`
);

const bundlePath = path.resolve(`./dist/${packageName}/bundle.html`);
open(bundlePath);
