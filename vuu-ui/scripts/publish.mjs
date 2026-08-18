import { execWait, getCommandLineArg } from "./utils.mjs";

const debug = getCommandLineArg("--debug");
const publishTag = getCommandLineArg("--tag", true);

if (publishTag && !["alpha", "beta"].includes(publishTag)) {
  throw Error(`Unsupported publish tag "${publishTag}". Use alpha or beta.`);
}

const packages = [
  "vuu-chart",
  "vuu-codemirror",
  "vuu-context-menu",
  "vuu-data-editing",
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
  "vuu-notifications",
  "vuu-shell",
  "vuu-table",
  "vuu-table-extras",
  "vuu-table-types",
  "vuu-theme",
  "vuu-ui-controls",
  "vuu-utils",
  "vuu-utils2",
];

async function publishPackage(packageName, suffix) {
  await execWait(
    `npm publish --registry https://registry.npmjs.org --access public${
      publishTag ? ` --tag ${publishTag}` : ""
    }`,
    `dist/${packageName}${suffix}`,
  );
}

const packageNameSuffix = debug ? "-debug" : "";
await Promise.all(
  packages.map((packageName) => publishPackage(packageName, packageNameSuffix)),
);
