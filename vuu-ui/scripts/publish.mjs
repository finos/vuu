import { execWait } from "./utils.mjs";

const packages = [
  "vuu-codemirror",
  "vuu-data",
  "vuu-data-types",
  "vuu-datagrid",
  "vuu-datagrid-extras",
  "vuu-datagrid-types",
  "vuu-datatable",
  "vuu-filters",
  "vuu-filter-types",
  "vuu-layout",
  "vuu-popups",
  "vuu-protocol-types",
  "vuu-shell",
  "vuu-theme",
  "vuu-utils",
];

async function publishPackage(packageName) {
  await execWait(
    "npm publish --registry https://registry.npmjs.org --access public",
    `dist/${packageName}`
  );
}

await Promise.all(packages.map((packageName) => publishPackage(packageName)));
