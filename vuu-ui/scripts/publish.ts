/**
 * Publish all packages, optionally using a prerelease npm dist-tag:
 *   npm run pub -- --tag alpha
 *   npm run pub -- --tag beta
 *
 * Check the package versions currently published on npm without publishing:
 *   npm run pub -- --version-check
 *
 * Add --debug to publish from the debug package output.
 * Add --verbose to print complete command output when a command fails.
 */
import { execWait } from "./utils.ts";
import { readJson } from "./package-json.ts";
import fs from "node:fs";

const registry = "https://registry.npmjs.org";
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
] as const;

type PackageName = (typeof packages)[number];
type PackageManifest = {
  name: string;
  version: string;
};
type NpmMetadata = {
  versions?: Record<string, unknown>;
  "dist-tags"?: {
    beta?: string;
    latest?: string;
  };
};

const PUBLISH_VERIFICATION_DELAY_MS = 10_000;

const getArgument = (name: string, expectsValue = false) => {
  const args = process.argv.slice(2);
  const argument = args.find(
    (value) => value === name || value.startsWith(`${name}=`),
  );
  if (!argument) return undefined;
  if (!expectsValue) return argument;
  if (argument.startsWith(`${name}=`)) return argument.slice(name.length + 1);
  const index = args.indexOf(argument);
  return args[index + 1];
};

const debug = getArgument("--debug") !== undefined;
const verbose = getArgument("--verbose") !== undefined;
const publishTag = getArgument("--tag", true);
const versionCheck = getArgument("--version-check") !== undefined;

if (publishTag && !["alpha", "beta"].includes(publishTag)) {
  throw Error(`Unsupported publish tag "${publishTag}". Use alpha or beta.`);
}

const readManifest = (filePath: string) =>
  readJson(filePath) as PackageManifest;

const readDistVersion = (packageName: PackageName) => {
  const filePath = `dist/${packageName}/package.json`;
  return fs.existsSync(filePath)
    ? readManifest(filePath).version
    : "unavailable";
};

const assertDistMatchesSource = () => {
  const mismatches = packages.flatMap((packageName) => {
    const sourceVersion = readManifest(
      `packages/${packageName}/package.json`,
    ).version;
    const distVersion = readDistVersion(packageName);
    return distVersion === sourceVersion
      ? []
      : [`${packageName}: source ${sourceVersion}, dist ${distVersion}`];
  });

  if (mismatches.length > 0) {
    throw Error(
      `Build output is missing or stale. Run the build before publishing: ${mismatches.join(
        " | ",
      )}`,
    );
  }
};

const publishPackage = async (packageName: PackageName, suffix: string) => {
  await execWait(
    `npm publish --registry ${registry} --access public${
      publishTag ? ` --tag ${publishTag}` : ""
    }`,
    `dist/${packageName}${suffix}`,
    verbose,
    true,
  );
};

const checkPackageVersion = async (packageName: PackageName) => {
  const { name, version } = readManifest(
    `packages/${packageName}/package.json`,
  );
  const distVersion = readDistVersion(packageName);
  const response = await fetch(`${registry}/${encodeURIComponent(name)}`);

  if (response.status === 404) {
    return {
      latestVersion: undefined,
      betaVersion: undefined,
      distVersion,
      name,
      published: false,
      version,
    };
  }
  if (!response.ok) {
    throw Error(`npm registry returned ${response.status} for ${name}`);
  }

  const metadata = (await response.json()) as NpmMetadata;
  return {
    betaVersion: metadata["dist-tags"]?.beta,
    distVersion,
    latestVersion: metadata["dist-tags"]?.latest,
    name,
    published: Object.hasOwn(metadata.versions ?? {}, version),
    version,
  };
};

const conciseReason = (reason: unknown) =>
  reason instanceof Error
    ? reason.message.replace(/\s*\r?\n\s*/g, " | ")
    : String(reason);

const runVersionCheck = async () => {
  const results = await Promise.allSettled(
    packages.map((packageName) => checkPackageVersion(packageName)),
  );
  const rows = results.map((result, index) => {
    const packageName = packages[index];
    if (result.status === "fulfilled") {
      return {
        package: result.value.name,
        "npm beta": result.value.betaVersion ?? "unavailable",
        "npm latest": result.value.latestVersion ?? "unavailable",
        "package.json": result.value.version,
        "dist/package.json": result.value.distVersion,
      };
    }
    return {
      package: packageName,
      "npm beta": "unavailable",
      "npm latest": "unavailable",
      "package.json": `failed: ${conciseReason(result.reason)}`,
      "dist/package.json": "unavailable",
    };
  });
  console.table(rows);
  return results;
};

const reportResults = (
  operation: "publish",
  results: PromiseSettledResult<void>[],
  packageNames: readonly string[] = packages,
) => {
  const rows = results.map((result, index) => ({
    package: packageNames[index],
    status: result.status === "fulfilled" ? "SUCCESS" : "FAIL",
    message:
      result.status === "fulfilled"
        ? `${operation} succeeded`
        : conciseReason(result.reason),
  }));
  console.table(rows);
};

if (versionCheck) {
  const results = await runVersionCheck();
  const failures = results.filter(({ status }) => status === "rejected");
  if (failures.length > 0) {
    throw Error(`${failures.length} version check(s) failed`);
  }
} else {
  const packageNameSuffix = debug ? "-debug" : "";
  assertDistMatchesSource();
  const publishResults = await Promise.allSettled(
    packages.map((packageName) =>
      publishPackage(packageName, packageNameSuffix),
    ),
  );
  reportResults("publish", publishResults);

  const publishedPackages = packages.filter(
    (_, index) => publishResults[index].status === "fulfilled",
  );
  if (publishedPackages.length > 0) {
    await new Promise((resolve) =>
      setTimeout(resolve, PUBLISH_VERIFICATION_DELAY_MS),
    );
  }
  const versionCheckResults = await runVersionCheck();

  const failures = [...publishResults, ...versionCheckResults].filter(
    ({ status }) => status === "rejected",
  );
  if (failures.length > 0) {
    throw Error(`${failures.length} package operation(s) failed`);
  }
}
