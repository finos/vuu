import { execWait, withArgs } from "./utils.mjs";

function buildPackage(packageName) {
  console.log(`build TypeScript typedefs for ${packageName}`);
  execWait(
    `npm run --silent type-defs${withArgs("debug")}`,
    `packages/${packageName}`
  ).catch(() => {
    console.error(`Error processing ${packageName}`);
  });
}

const packages = [
  "vuu-utils",
  "vuu-data",
  "vuu-data-ag-grid",
  "vuu-filters",
  "vuu-popups",
  "vuu-datatable",
  "vuu-table",
  "vuu-table-extras",
  "vuu-layout",
  "vuu-shell",
];

packages.forEach(buildPackage);
