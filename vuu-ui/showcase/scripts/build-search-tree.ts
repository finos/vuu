import path from "path";
import { searchTargetsFromFileSystem } from "./searchTargetsFromFileSystem";
import { writeFile } from "../../scripts/utils.mjs";

const outdir = "dist";

const start = performance.now();
const treeSourceJson = searchTargetsFromFileSystem("./src/examples", "");
const end = performance.now();
console.log(`building the search tree took ${end - start} ms`);
await writeFile(
  `export default ${JSON.stringify(treeSourceJson, null, 2)};`,
  path.resolve(outdir, "searchTreeJson.js"),
);
