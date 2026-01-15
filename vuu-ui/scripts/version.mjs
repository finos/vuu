import { execWait, readPackageJson } from "./utils.mjs";
import fs from "fs";

const packages = [
  "packages/vuu-protocol-types",
  "packages/vuu-utils",
  "packages/vuu-theme-deprecated",
  "packages/vuu-data-local",
  "packages/vuu-data-remote",
  "packages/vuu-layout",
  "packages/vuu-shell",
  "packages/vuu-filters",
  "packages/vuu-filter-parser",
  "sample-apps/app-vuu-example",
  "sample-apps/feature-filtered-grid",
  "sample-apps/feature-vuu-blotter",
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

export const bumpDependencies = (packagePath) => {
  const packageJsonPath = `${packagePath}/package.json`;
  let json = readPackageJson(packageJsonPath);
  let { version, dependencies, peerDependencies } = json;
  if (dependencies || peerDependencies) {
    dependencies && rewriteDependencyVersions(dependencies, version);
    peerDependencies && rewriteDependencyVersions(peerDependencies, version);
    fs.writeFileSync(packageJsonPath, JSON.stringify(json, null, 2));
  }
};

async function bumpPackageVersion(packagePath) {
  try {
    await execWait("npm version --patch --no-git-tag-version", packagePath);
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
}

function bumpPackageDependencyVersions(packagePath) {
  bumpDependencies(packagePath);
}

await Promise.all(
  packages.map((packagePath) => bumpPackageVersion(packagePath)),
);
packages.forEach((packagePath) => bumpPackageDependencyVersions(packagePath));
