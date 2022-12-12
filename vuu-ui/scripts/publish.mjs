import { exec } from "child_process";
import { execCallback } from "./utils.mjs";

const packages = [
  "vuu-protocol-types",
  "vuu-utils",
  "vuu-data-ag-grid",
  "vuu-theme",
  "vuu-data",
  "datagrid-parsers",
  "ui-controls",
  "vuu-filters",
  "vuu-datagrid",
  "vuu-layout",
  "parsed-input",
  "vuu-shell",
];

function publishPackage(packageName) {
  exec(
    "npm publish --registry https://registry.npmjs.org --access-public",
    { cwd: `packages/${packageName}` },
    execCallback
  );
}

packages.forEach((packageName) => publishPackage(packageName));
