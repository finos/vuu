import fs from "fs";
import path from "path";

const file = "websocket-test.html";

const outdir = "./deployed_apps/app-vuu-example";
const filePath = path.resolve("tools", file);
const outPath = path.resolve(outdir, file);
fs.cp(filePath, outPath, { recursive: true }, (err) => {
  if (err) throw err;
});
