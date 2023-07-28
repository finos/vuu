import fs from "fs";
fs.copyFileSync("./templates/index-mobile.js", "./src/pages/index.js");
fs.copyFileSync("./src/css/custom-mobile.css", "./src/css/custom.css");
fs.copyFileSync(
  "./templates/docusaurus-mobile.config.js",
  "./docusaurus.config.js"
);
