import open from "open";
import chalk from "chalk";
import buildMdxDocs from "./build-docs.mjs";

import { execWait } from "../../scripts/utils.mjs";

await buildMdxDocs();

execWait("npm run dev");

console.log(`opening showcase at ${chalk.green("http://localhost:5173/")} ...`);

setTimeout(() => {
  open("http://localhost:5173/");
}, 3000);
