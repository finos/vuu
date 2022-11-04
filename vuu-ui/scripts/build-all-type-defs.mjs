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
  "utils",
  //   'react-utils',
  //   'theme',
  "data-remote",
  //   'data-store',
  //   'data-worker',
  "datagrid-parsers",
  //   'ui-controls',
  //   'data-grid',
  //   'layout',
  //   'parsed-input',
  //   'shell'
];

packages.forEach(buildPackage);
