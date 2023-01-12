import path from "path";
import { platform } from "os";
import { execWait, getCommandLineArg } from "./utils.mjs";
import chalk from "chalk";

const osPlatform = platform();

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
  `node ./node_modules/.bin/esbuild-visualizer --metadata ./dist/${packageName}/meta.json --filename ./dist/${packageName}/bundle.html`
);

const bundlePath = path.resolve(`./dist/${packageName}/bundle.html`);
console.log(bundlePath);
if (osPlatform === "darwin") {
  execWait(`open -a "Google Chrome" file://${bundlePath}`);
}
