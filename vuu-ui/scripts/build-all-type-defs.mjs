import { execWait, withArgs } from "./utils.mjs";

function buildPackage(packageName) {
  console.log(`build TypeScript typedefs for ${packageName}`);
  execWait(
    `npm run --silent type-defs${withArgs("debug")}`,
    `packages/${packageName}`,
  ).catch(() => {
    console.error(`Error processing ${packageName}`);
  });
}

const packages = [
  "grid-layout",
  "vuu-context-menu",
  "vuu-codemirror",
  "vuu-data-local",
  "vuu-data-react",
  "vuu-data-remote",
  "vuu-data-test",
  "vuu-datatable",
  "vuu-filter-parser",
  "vuu-filters",
  "vuu-layout",
  "vuu-popups",
  "vuu-shell",
  "vuu-table",
  "vuu-table-extras",
  "vuu-ui-controls",
  "vuu-utils",
];

packages.forEach(buildPackage);
