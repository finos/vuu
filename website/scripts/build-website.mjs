import { execWait, writeFile } from "../../vuu-ui/scripts/utils.mjs";
import fs from "fs";
import path from "path";

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

const desktopPath = path.resolve("../website-desktop");
console.log(desktopPath);

// console.log(`run mobile build`);
// await execWait("docusaurus build");

// console.log(`inject desktop redirect into mobile`);
// await injectScript();

console.log(`run desktop build`);
await execWait(`node ./scripts/build-desktop.mjs`, desktopPath);
