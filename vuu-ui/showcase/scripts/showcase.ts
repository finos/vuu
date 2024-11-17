import fs from "fs";
import open from "open";
import chalk from "chalk";
import { treeSourceFromFileSystem } from "./treeSourceFromFileSystem";
import { createFolder, execWait, writeFile } from "../../scripts/utils.mjs";

const start = performance.now();
const treeSourceJson = treeSourceFromFileSystem("./src/examples", "");
const end = performance.now();
console.log(`building tree took ${end - start}ms`);

if (!fs.existsSync(".showcase")) {
  createFolder(".showcase");
}

await writeFile(
  `export default ${JSON.stringify(treeSourceJson)};`,
  "./.showcase/treeSourceJson.js",
);
execWait("npm run dev");

console.log(`opening showcase at ${chalk.green("http://localhost:5173/")} ...`);

setTimeout(() => {
  open("http://localhost:5173/");
}, 3000);
