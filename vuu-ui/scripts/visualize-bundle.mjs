import path from "path";
import { platform } from "os";
import { execWait, getCommandLineArg } from "./utils.mjs";

const osPlatform = platform();

console.log({ platform: platform() });

const packageName = getCommandLineArg("--package", true);

console.log(`visualize bundle ${packageName}`);

await execWait(
  `node ./node_modules/.bin/esbuild-visualizer --metadata ./dist/${packageName}/meta.json --filename ./dist/${packageName}/bundle.html`
);

const bundlePath = path.resolve(`./dist/${packageName}/bundle.html`);
console.log(bundlePath);
if (osPlatform === "darwin") {
  execWait(`open -a "Google Chrome" file://${bundlePath}`);
}
