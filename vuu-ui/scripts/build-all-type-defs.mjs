import { execWait } from "./utils.mjs";

function buildPackage(packageName) {
  execWait("yarn --silent type-defs", `packages/${packageName}`);
}

const packages = [
  "vuu-utils",
  //   'react-utils',
  //   'vuu-theme',
  "vuu-data",
  //   'ui-controls',
  //   'vuu-datagrid',
  "vuu-datatable",
  // "vuu-datagrid-extras",
  "vuu-layout",
  //   'vuu-shell'
];

packages.forEach(buildPackage);
