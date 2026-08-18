import { execWait, getCommandLineArg, readPackageJson } from "./utils.mjs";

const debug = getCommandLineArg("--debug");
const publishTag = getCommandLineArg("--tag", true);
const registry = "https://registry.npmjs.org";

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
    `npm publish --registry ${registry} --access public${
      publishTag ? ` --tag ${publishTag}` : ""
    }`,
    `dist/${packageName}${suffix}`,
  );
}

async function verifyPublishedPackage(packageName, suffix) {
  const { name, version } = readPackageJson(
    `dist/${packageName}${suffix}/package.json`,
  );
  await execWait(
    `npm view ${name}@${version} version --registry ${registry}`,
  );
}

const reportResults = (operation, results) => {
  results.forEach((result, index) => {
    const packageName = packages[index];
    if (result.status === "fulfilled") {
      console.log(`${operation}: ${packageName} succeeded`);
    } else {
      const reason =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);
      console.error(`${operation}: ${packageName} failed: ${reason}`);
    }
  });
};

const packageNameSuffix = debug ? "-debug" : "";
const publishResults = await Promise.allSettled(
  packages.map((packageName) => publishPackage(packageName, packageNameSuffix)),
);
reportResults("publish", publishResults);

const verificationResults = await Promise.allSettled(
  packages.map((packageName) =>
    verifyPublishedPackage(packageName, packageNameSuffix),
  ),
);
reportResults("verify", verificationResults);

const failures = [...publishResults, ...verificationResults].filter(
  ({ status }) => status === "rejected",
);
if (failures.length > 0) {
  throw Error(`${failures.length} package operation(s) failed`);
}
