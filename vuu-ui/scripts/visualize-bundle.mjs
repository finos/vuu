import path from "path";
import { execWait, getCommandLineArg } from "./utils.mjs";
import chalk from "chalk";
import open from "open";

const packageName = getCommandLineArg("--package", true);
const appName = getCommandLineArg("--app", true);

if (!packageName && !appName) {
  console.error(
    chalk.red.bold(
      "Package or App name must be specified with command, e.g.\n --package vuu-data \n --app app-vuu-example"
    )
  );
  process.exit(1);
}

const pathName = packageName
  ? `./dist/${packageName}`
  : `./deployed_apps/${appName}`;

await execWait(
  `esbuild-visualizer --metadata ${pathName}/meta.json --filename ${pathName}/bundle.html`
);

const bundlePath = path.resolve(`${pathName}/bundle.html`);
open(bundlePath);
