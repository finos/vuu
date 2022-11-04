import { execWait, readPackageJson } from "./utils.mjs";
import fs from "fs";

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

export const bumpDependencies = (packageName) => {
  const packageJsonPath = `packages/${packageName}/package.json`;
  let json = readPackageJson(packageJsonPath);
  let { version, dependencies, peerDependencies } = json;
  if (dependencies || peerDependencies) {
    dependencies && rewriteDependencyVersions(dependencies, version);
    peerDependencies && rewriteDependencyVersions(peerDependencies, version);
    fs.writeFileSync(packageJsonPath, JSON.stringify(json, null, 2));
  }
};

async function bumpPackageVersion(packageName) {
  await execWait(
    "yarn version --patch --no-git-tag-version",
    `packages/${packageName}`
  );
}

function bumpPackageDependencyVersions(packageName) {
  bumpDependencies(packageName);
}

await Promise.all(
  packages.map((packageName) => bumpPackageVersion(packageName))
);
packages.forEach((packageName) => bumpPackageDependencyVersions(packageName));
