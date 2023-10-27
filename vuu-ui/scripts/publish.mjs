import { execWait, getCommandLineArg } from "./utils.mjs";

const debug = getCommandLineArg("--debug");

const packages = [
  "vuu-codemirror",
  "vuu-data",
  "vuu-data-react",
  "vuu-data-test",
  "vuu-data-ag-grid",
  "vuu-data-test",
  "vuu-data-types",
  "vuu-table-extras",
  "vuu-datagrid-types",
  "vuu-table",
  "vuu-filter-types",
  "vuu-filter-parser",
  "vuu-filters",
  "vuu-layout",
  "vuu-popups",
  "vuu-protocol-types",
  "vuu-shell",
  "vuu-theme",
  "vuu-ui-controls",
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
