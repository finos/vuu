import shell from "shelljs";
import fs from "fs";
import { readPackageJson } from "./utils.mjs";

const packages = [
  "utils",
  "ag-grid",
  "react-utils",
  "theme",
  "theme-uitk",
  "data-remote",
  "data-store",
  "datagrid-parsers",
  "ui-controls",
  "ui-forms",
  "data-grid",
  "layout",
  "parsed-input",
  "shell",
  "app",
  "app-vuu-example",
  "showcase",
];

const rewriteDependencyVersions = (dependencies, version) => {
  let deps = Object.keys(dependencies).slice();
  deps.forEach((pckName) => {
    if (pckName.startsWith("@vuu-ui")) {
      dependencies[pckName] = version;
    }
  });
};

export const bumpDependencies = () => {
  let json = readPackageJson();
  let { version, dependencies, peerDependencies } = json;
  if (dependencies || peerDependencies) {
    dependencies && rewriteDependencyVersions(dependencies, version);
    peerDependencies && rewriteDependencyVersions(peerDependencies, version);
    fs.writeFileSync("package.json", JSON.stringify(json, null, 2));
  }
};

function bumpPackageVersion(packageName) {
  shell.cd(`packages/${packageName}`);
  shell.exec("yarn version --patch --no-git-tag-version");
  shell.cd("../..");
}

function bumpPackageDependencyVersions(packageName) {
  shell.cd(`packages/${packageName}`);
  bumpDependencies();
  shell.cd("../..");
}

packages.forEach((packageName) => bumpPackageVersion(packageName));
packages.forEach((packageName) => bumpPackageDependencyVersions(packageName));
