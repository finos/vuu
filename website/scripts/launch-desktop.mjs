import fs from "fs";
fs.copyFileSync("./templates/index-desktop.js", "./src/pages/index.js");
fs.copyFileSync("./src/css/custom-desktop.css", "./src/css/custom.css");
fs.copyFileSync(
  "./templates/docusaurus-desktop.config.js",
  "./docusaurus.config.js"
);
