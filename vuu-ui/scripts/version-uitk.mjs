import shell from "shelljs";
import fs from "fs";
import { readPackageJson } from "./utils.mjs";

const uitkPackages = ["core", "icons", "lab"];

const vuuPackages = [
  "utils",
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

const rewriteDependencyVersions = (dependencies, name, version) => {
  if (dependencies[name]) {
    dependencies[name] = version;
  }
};

export const bumpDependencies = (name, version) => {
  let json = readPackageJson();
  let { dependencies, peerDependencies } = json;
  if (dependencies?.[name] || peerDependencies?.[name]) {
    dependencies && rewriteDependencyVersions(dependencies, name, version);
    peerDependencies &&
      rewriteDependencyVersions(peerDependencies, name, version);
    fs.writeFileSync("package.json", JSON.stringify(json, null, 2));
  }
};

export const bumpVersion = (packageName) => {
  shell.cd(`uitk/packages/${packageName}`);
  let json = readPackageJson();
  let { name, version } = json;
  const pos = version.lastIndexOf(".");
  const mainVersion = version.slice(0, pos);
  const vuuVersion = version.slice(pos + 1);
  const newVersion = `${mainVersion}.${parseInt(vuuVersion) + 1}`;
  fs.writeFileSync(
    "package.json",
    JSON.stringify(
      {
        ...json,
        version: newVersion,
      },
      null,
      2
    )
  );
  shell.cd(`../../..`);
  console.log(`package ${name} version changed to ${newVersion}`);

  uitkPackages
    .filter((name) => name !== packageName)
    .forEach((packageName) => {
      shell.cd(`uitk/packages/${packageName}`);
      bumpDependencies(name, newVersion);
      shell.cd("../../..");
    });

  vuuPackages.forEach((packageName) => {
    shell.cd(`packages/${packageName}`);
    bumpDependencies(name, newVersion);
    shell.cd(`../..`);
  });
};

function bumpPackageVersion(packageName) {
  bumpVersion(packageName);
}

uitkPackages.forEach((packageName) => bumpPackageVersion(packageName));

//packages.forEach((packageName) => bumpPackageDependencyVersions(packageName));
