import { execWait } from "./utils.mjs";

const args = process.argv.slice(2);
const dev = args.includes("--dev") ? " --dev" : "";
const cjs = args.includes("--cjs") ? " --cjs" : "";

const buildPackage = async (packageName) =>
  execWait(`yarn --silent build${dev}${cjs}`, `packages/${packageName}`);

// TODO determine the dependency graph/build order programatically
const wave1 = ["vuu-utils", "vuu-theme"];
const wave2 = ["vuu-data", "datagrid-parsers", "ui-controls", "vuu-filters"];
const wave3 = ["vuu-datagrid", "vuu-layout", "parsed-input", "vuu-shell"];

await Promise.all(wave1.map(buildPackage));
await Promise.all(wave2.map(buildPackage));
await Promise.all(wave3.map(buildPackage));
