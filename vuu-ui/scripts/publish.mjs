import { exec } from "child_process";
import { execCallback } from "./utils.mjs";

const packages = [
  "utils",
  "ag-grid",
  "react-utils",
  "theme",
  "data-remote",
  "data-store",
  "datagrid-parsers",
  "ui-controls",
  "data-grid",
  "layout",
  "parsed-input",
  "shell",
];

function publishPackage(packageName) {
  exec(
    "npm publish --registry https://registry.npmjs.org --access-public",
    { cwd: `packages/${packageName}` },
    execCallback
  );
}

packages.forEach((packageName) => publishPackage(packageName));
