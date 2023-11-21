import path from "path";
import { execWait, writeFile } from "../../vuu-ui/scripts/utils.mjs";

const desktopPath = path.resolve("../website-desktop");
console.log(desktopPath);

console.log(`run mobile build`);
await execWait("docusaurus build");

console.log("do some stuff here");

console.log(`run desktop build`);
await execWait("docusaurus build --out-dir ./build/desktop");
