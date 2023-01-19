import { execWait } from "./utils.mjs";

const packages = [
  "vuu-protocol-types",
  "vuu-datagrid-types",
  "vuu-filter-types",
  "vuu-utils",
  "vuu-theme",
  "vuu-data",
  "vuu-filters",
  "vuu-datagrid",
  "vuu-datagrid-extras",
  "vuu-layout",
  "vuu-shell",
];

async function publishPackage(packageName) {
  await execWait(
    "npm publish --registry https://registry.npmjs.org --access public",
    `dist/${packageName}`
  );
}

await Promise.all(packages.map((packageName) => publishPackage(packageName)));
