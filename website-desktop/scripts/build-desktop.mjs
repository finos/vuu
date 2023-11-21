import { execWait, writeFile } from "../../vuu-ui/scripts/utils.mjs";
import fs from "fs";
import { execSync } from "child_process";

const redirectToDesktop = `<script>if (window.innerWidth > 1380) window.location.href="/desktop"</script>`;

async function injectScript(path = "./build/index.html") {
  return new Promise((resolve, reject) => {
    var text = fs.readFileSync(path).toString();
    const insertPos = text.indexOf("<title");
    if (insertPos !== -1) {
      text = text.replace("<title", `${redirectToDesktop}<title`);
      return writeFile(text, path);
    }
  });
}

console.log(`run desktop build`);
await execWait("docusaurus build --out-dir ../website/build/desktop");
// let stdout = execSync("docusaurus build --out-dir ../website/build/desktop");
// console.log(stdout.toString());

// console.log(`inject desktop redirect into mobile`);
// await injectScript();

// console.log(`run desktop build`);
// await execWait(`docusaurus build`);
