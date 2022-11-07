import { execWait } from "./utils.mjs";

const args = process.argv.slice(2);
const dev = args.includes("--dev") ? " --dev" : "";
const cjs = args.includes("--cjs") ? " --cjs" : "";

const buildPackage = async (packageName) =>
  execWait(`yarn --silent build${dev}${cjs}`, `packages/${packageName}`);

// TODO determine the dependency graph/build order programatically
const wave1 = ["utils", "react-utils", "theme", "theme-uitk"];
const wave2 = ["data-remote", "datagrid-parsers", "ui-controls"];
const wave3 = ["data-grid", "ag-grid", "layout", "parsed-input", "shell"];

await Promise.all(wave1.map(buildPackage));
await Promise.all(wave2.map(buildPackage));
await Promise.all(wave3.map(buildPackage));
