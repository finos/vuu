import fs from "fs";
import { execWait } from "../../vuu-ui/scripts/utils.mjs";

console.log(`mobile build ...`);
fs.copyFileSync("./src-mobile/css/custom-mobile.css", "./src/css/custom.css");
fs.copyFileSync(
  "./src-mobile/css/docs-pages-mobile.css",
  "./src/css/docs-pages.css"
);
fs.copyFileSync("./src-mobile/pages/index-mobile.js", "./src/pages/index.js");
await execWait("docusaurus build --config ./docusaurus.config.mobile.js");

console.log(`desktop build ...`);
fs.copyFileSync("./src-desktop/css/custom-desktop.css", "./src/css/custom.css");
fs.copyFileSync(
  "./src-desktop/css/docs-pages-desktop.css",
  "./src/css/docs-pages.css"
);
fs.copyFileSync("./src-desktop/pages/index-desktop.js", "./src/pages/index.js");
await execWait(
  "docusaurus build --config ./docusaurus.config.desktop.js --out-dir ./build/desktop"
);
