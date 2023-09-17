import fs from "fs";
import open from "open";
import chalk from "chalk";

import { execWait } from "../../scripts/utils.mjs";

fs.copyFileSync("./templates/index.html", "./index.html");

execWait("npm run dev");

console.log(`opening showcase at ${chalk.green("http://127.0.0.1:5173/")} ...`);

setTimeout(() => {
  open("http://127.0.0.1:5173/");
}, 3000);
