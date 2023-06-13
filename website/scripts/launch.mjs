import fs from "fs";
import open from "open";
// import chalk from "chalk";

// import { execWait } from "../../scripts/utils.mjs";

fs.copyFileSync("./index-mobile.js", "../src/pages/index.js");

// execWait("yarn vite");

// console.log(`opening showcase at ${chalk.green("http://127.0.0.1:5173/")} ...`);

setTimeout(() => {
  open("http://localhost:3000/");
}, 3000);
