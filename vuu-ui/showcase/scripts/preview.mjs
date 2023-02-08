import open from "open";
import chalk from "chalk";
import { execWait } from "../../scripts/utils.mjs";

import "./copy-preview.mjs";

// fs.copyFileSync("./templates/index-preview.html", "./index.html");

execWait("node ../node_modules/.bin/vite preview");

console.log(`opening showcase at ${chalk.green("http://127.0.0.1:4173/")} ...`);

setTimeout(() => {
  open("http://127.0.0.1:4173/");
}, 1000);
