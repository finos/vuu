import { execWait, getCommandLineArg } from "./utils.mjs";

const debug = getCommandLineArg("--debug");

const packages = [
  "vuu-codemirror",
  "vuu-data",
  "vuu-data-types",
  "vuu-data-ag-grid",
  "vuu-datagrid",
  "vuu-datagrid-extras",
  "vuu-datagrid-types",
  "vuu-datatable",
  "vuu-filter-types",
  "vuu-filters",
  "vuu-layout",
  "vuu-protocol-types",
  "vuu-shell",
  "vuu-theme",
  "vuu-utils",
];

async function publishPackage(packageName, suffix) {
  await execWait(
    "npm publish --registry https://registry.npmjs.org --access public",
    `dist/${packageName}${suffix}`
  );
}

const packageNameSuffix = debug ? "-debug" : "";
await Promise.all(
  packages.map((packageName) => publishPackage(packageName, packageNameSuffix))
);
