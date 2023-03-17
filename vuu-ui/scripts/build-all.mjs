import { execWait, withArgs } from "./utils.mjs";

const buildPackage = async (packageName) =>
  execWait(
    `yarn --silent build${withArgs("dev", "cjs", "debug")}`,
    `packages/${packageName}`
  );

// TODO determine the dependency graph/build order programatically
const wave1 = [
  "vuu-data-types",
  "vuu-datagrid-types",
  "vuu-filter-types",
  "vuu-protocol-types",
  "vuu-utils",
  "vuu-codemirror",
  "vuu-theme",
];
const wave2 = ["vuu-data", "vuu-filters", "vuu-popups"];
const wave3 = [
  "vuu-datagrid",
  "vuu-table",
  "vuu-data-ag-grid",
  "vuu-datagrid-extras",
  "vuu-layout",
  "vuu-shell",
];

await Promise.all(wave1.map(buildPackage));
await Promise.all(wave2.map(buildPackage));
await Promise.all(wave3.map(buildPackage));
