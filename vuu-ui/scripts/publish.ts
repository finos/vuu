/**
 * Publish all packages, optionally using a prerelease npm dist-tag:
 *   npm run pub -- --tag alpha
 *   npm run pub -- --tag beta
 *
 * Check the package versions currently published on npm without publishing:
 *   npm run pub -- --version-check
 *
 * Add --debug to publish from the debug package output.
 */
import { execWait } from "./utils.ts";
import { readJson } from "./package-json.ts";

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
    latest?: string;
  };
};

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
const publishTag = getArgument("--tag", true);
const versionCheck = getArgument("--version-check") !== undefined;

if (publishTag && !["alpha", "beta"].includes(publishTag)) {
  throw Error(`Unsupported publish tag "${publishTag}". Use alpha or beta.`);
}

const readManifest = (filePath: string) =>
  readJson(filePath) as PackageManifest;

const publishPackage = async (packageName: PackageName, suffix: string) => {
  await execWait(
    `npm publish --registry ${registry} --access public${
      publishTag ? ` --tag ${publishTag}` : ""
    }`,
    `dist/${packageName}${suffix}`,
  );
};

const verifyPublishedPackage = async (
  packageName: PackageName,
  suffix: string,
) => {
  const { name, version } = readManifest(
    `dist/${packageName}${suffix}/package.json`,
  );
  try {
    await execWait(`npm view ${name}@${version} version --registry ${registry}`);
  } catch {
    throw Error(`npm verification failed for ${name}@${version}`);
  }
};

const checkPackageVersion = async (packageName: PackageName) => {
  const { name, version } = readManifest(
    `packages/${packageName}/package.json`,
  );
  const response = await fetch(`${registry}/${encodeURIComponent(name)}`);

  if (response.status === 404) {
    return {
      latestVersion: undefined,
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

const reportResults = (
  operation: "publish" | "verify",
  results: PromiseSettledResult<void>[],
  packageNames: readonly string[] = packages,
) => {
  const rows = results.map((result, index) => ({
    package: packageNames[index],
    status: result.status === "fulfilled" ? "success" : "fail",
    message:
      result.status === "fulfilled"
        ? `${operation} succeeded`
        : conciseReason(result.reason),
  }));
  const widths = {
    package: Math.max("package".length, ...rows.map(({ package: name }) => name.length)),
    status: Math.max("status".length, "SUCCESS".length, "FAIL".length),
    message: Math.max("message".length, ...rows.map(({ message }) => message.length)),
  };
  const formatRow = (row: (typeof rows)[number]) =>
    `${row.package.padEnd(widths.package)}  ${row.status.padEnd(widths.status)}  ${row.message}`;

  console.log(`${"package".padEnd(widths.package)}  ${"status".padEnd(widths.status)}  message`);
  console.log(`${"-".repeat(widths.package)}  ${"-".repeat(widths.status)}  ${"-".repeat(widths.message)}`);
  rows.forEach((row) => {
    console.log(
      formatRow({
        ...row,
        status: row.status === "fail" ? "FAIL" : "SUCCESS",
      }),
    );
  });
};

if (versionCheck) {
  const results = await Promise.allSettled(
    packages.map((packageName) => checkPackageVersion(packageName)),
  );
  const rows = results.map((result, index) => {
    const packageName = packages[index];
    if (result.status === "fulfilled") {
      return {
        package: result.value.name,
        latest: result.value.latestVersion ?? "unavailable",
        current: result.value.version,
      };
    }
    return {
      package: packageName,
      latest: "unavailable",
      current: `failed: ${conciseReason(result.reason)}`,
    };
  });
  console.table(rows);
  const failures = results.filter(({ status }) => status === "rejected");
  if (failures.length > 0) {
    throw Error(`${failures.length} version check(s) failed`);
  }
} else {
  const packageNameSuffix = debug ? "-debug" : "";
  const publishResults = await Promise.allSettled(
    packages.map((packageName) =>
      publishPackage(packageName, packageNameSuffix),
    ),
  );
  reportResults("publish", publishResults);

  const publishedPackages = packages.filter(
    (_, index) => publishResults[index].status === "fulfilled",
  );
  const verificationResults = await Promise.allSettled(
    publishedPackages.map((packageName) =>
      verifyPublishedPackage(packageName, packageNameSuffix),
    ),
  );
  reportResults("verify", verificationResults, publishedPackages);

  const failures = [...publishResults, ...verificationResults].filter(
    ({ status }) => status === "rejected",
  );
  if (failures.length > 0) {
    throw Error(`${failures.length} package operation(s) failed`);
  }
}
