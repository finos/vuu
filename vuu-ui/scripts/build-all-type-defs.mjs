import { execWait, withArgs } from "./utils.mjs";

function buildPackage(packageName) {
  console.log(`build TypeScript typedefs for ${packageName}`);
  execWait(
    `yarn --silent type-defs${withArgs("debug")}`,
    `packages/${packageName}`
  );
}

const packages = [
  "vuu-utils",
  "vuu-data",
  "vuu-data-ag-grid",
  "vuu-filters",
  "vuu-popups",
  "vuu-table",
  "vuu-datagrid-extras",
  "vuu-layout",
  "vuu-shell",
];

packages.forEach(buildPackage);
