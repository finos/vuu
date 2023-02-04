import { execWait } from "./utils.mjs";

const args = process.argv.slice(2);
const dev = args.includes("--dev") ? " --dev" : "";
const cjs = args.includes("--cjs") ? " --cjs" : "";

const buildPackage = async (packageName) =>
  execWait(`yarn --silent build${dev}${cjs}`, `packages/${packageName}`);

// TODO determine the dependency graph/build order programatically
const wave1 = [
  "vuu-data-types",
  "vuu-datagrid-types",
  "vuu-filter-types",
  "vuu-protocol-types",
  "vuu-utils",
  "vuu-theme",
];
const wave2 = ["vuu-data", "vuu-filters", "vuu-popups"];
const wave3 = [
  "vuu-datagrid",
  "vuu-datatable",
  "vuu-datagrid-extras",
  "vuu-layout",
  "vuu-shell",
];

await Promise.all(wave1.map(buildPackage));
await Promise.all(wave2.map(buildPackage));
await Promise.all(wave3.map(buildPackage));
