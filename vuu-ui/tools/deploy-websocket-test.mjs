import fs from "fs";
import path from "path";
import { copyFolderSync } from "../scripts/utils.mjs";

const file = "websocket-test.html";

const outdir = "./deployed_apps/app-vuu-example";
const filePath = path.resolve("tools", file);
const outPath = path.resolve(outdir, file);
if (typeof fs.cp === "function") {
  // node v16.7 +
  fs.cp(filePath, outPath, { recursive: true }, (err) => {
    if (err) throw err;
  });
} else {
  // delete once we no longer need to support node16 < .7
  copyFolderSync(filePath, outPath);
}
