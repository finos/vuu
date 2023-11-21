import fs from "fs";
import { execWait, writeFile } from "../../vuu-ui/scripts/utils.mjs";

console.log(`run mobile build`);
fs.copyFileSync("./src-mobile/pages/index-mobile.js", "./src/pages/index.js");
await execWait("docusaurus build");

console.log("do some stuff here");

console.log(`run desktop build`);
fs.copyFileSync("./src-desktop/pages/index-desktop.js", "./src/pages/index.js");
await execWait(
  "docusaurus build --config ./docusaurus.config.desktop.js --out-dir ./build/desktop"
);
