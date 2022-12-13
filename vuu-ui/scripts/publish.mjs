import { execWait } from "./utils.mjs";

const packages = [
  "vuu-protocol-types",
  "vuu-utils",
  "vuu-theme",
  "vuu-data",
  "ui-controls",
  "vuu-filters",
  "vuu-datagrid",
  "vuu-layout",
  "vuu-shell",
];

async function publishPackage(packageName) {
  await execWait(
    "npm publish --registry https://registry.npmjs.org --access public",
    `packages/${packageName}`
  );
}

await Promise.all(packages.map((packageName) => publishPackage(packageName)));
