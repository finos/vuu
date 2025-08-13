import { execWait, getCommandLineArg } from "./utils.mjs";

const debug = getCommandLineArg("--debug");

const packages = [
  "vuu-codemirror",
  "vuu-context-menu",
  "vuu-data-local",
  "vuu-data-remote",
  "vuu-data-react",
  "vuu-data-test",
  "vuu-data-types",
  "vuu-datatable",
  "vuu-filter-parser",
  "vuu-filter-types",
  "vuu-filters",
  "vuu-icons",
  "vuu-layout",
  "vuu-popups",
  "vuu-protocol-types",
  "vuu-shell",
  "vuu-table",
  "vuu-table-extras",
  "vuu-table-types",
  "vuu-theme",
  "vuu-ui-controls",
  "vuu-utils",
];

async function publishPackage(packageName, suffix) {
  await execWait(
    "npm publish --registry https://registry.npmjs.org --access public",
    `dist/${packageName}${suffix}`,
  );
}

const packageNameSuffix = debug ? "-debug" : "";
await Promise.all(
  packages.map((packageName) => publishPackage(packageName, packageNameSuffix)),
);
