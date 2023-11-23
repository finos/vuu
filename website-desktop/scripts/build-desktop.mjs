import { execWait, writeFile } from "../../vuu-ui/scripts/utils.mjs";
import fs from "fs";
import { execSync } from "child_process";

const redirectToDesktop = `<script>if (window.innerWidth > 1380) window.location.href="/desktop"</script>`;

console.log(`run desktop build`);
await execWait("docusaurus build --out-dir ../website/build/desktop");
// let stdout = execSync("docusaurus build --out-dir ../website/build/desktop");
// console.log(stdout.toString());

// console.log(`run desktop build`);
// await execWait(`docusaurus build`);
