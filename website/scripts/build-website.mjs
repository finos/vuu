import { execWait, writeFile } from "../../vuu-ui/scripts/utils.mjs";

const desktopPath = path.resolve("../website-desktop");
console.log(desktopPath);

console.log(`run mobile build`);
await execWait("docusaurus build");

console.log(`run desktop build`);
await execWait(`node ./scripts/build-desktop.mjs`, desktopPath);
