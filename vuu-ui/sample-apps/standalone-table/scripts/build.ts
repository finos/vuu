import path from "node:path";
import { parseArgs } from "node:util";
import {
  addStylesheetLinks,
  buildSampleApp,
  entryCss,
} from "../../../scripts/build-sample-app.ts";

const appDir = path.resolve(import.meta.dirname, "..");
const outDir = path.resolve(appDir, "../../deployed_apps/standalone-table");

const { values: args } = parseArgs({
  options: {
    dev: { type: "boolean", default: false },
  },
});

console.log(`[BUILD] ${args.dev ? "development" : "production"}`);
const start = performance.now();
const manifest = await buildSampleApp({
  appDir,
  development: args.dev,
  entries: { index: "./index.tsx" },
  outDir,
});
await addStylesheetLinks(
  path.join(outDir, "index.html"),
  entryCss(manifest, "index"),
);
console.log(
  `build took ${((performance.now() - start) / 1000).toFixed(1)}s -> ${path.relative(process.cwd(), outDir)}`,
);
