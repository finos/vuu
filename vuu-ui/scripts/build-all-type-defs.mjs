import { exec } from "child_process";
import { execCallback } from "./utils.mjs";

function buildPackage(packageName) {
  exec(
    "yarn --silent type-defs",
    { cwd: `packages/${packageName}` },
    execCallback
  );
}

const packages = [
  "vuu-utils",
  //   'react-utils',
  //   'vuu-theme',
  "vuu-data",
  //   'ui-controls',
  //   'vuu-datagrid',
  //   'vuu-layout',
  //   'vuu-shell'
];

packages.forEach(buildPackage);
