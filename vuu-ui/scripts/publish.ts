/**
 * Publish all packages, optionally using a prerelease npm dist-tag:
 *   npm run pub -- --tag alpha
 *   npm run pub -- --tag beta
 *
 * Check the package versions currently published on npm without publishing:
 *   npm run pub -- --version-check
 *
 * Add --package <name> to publish (or version-check) a single package.
 * Add --debug to publish from the debug package output.
 * Add --verbose to print complete command output when a command fails.
 * Add --help to print out the available command flags.
 */
import { execWait } from "./utils.ts";
import { readJson } from "./package-json.ts";
import fs from "node:fs";

const registry = "https://registry.npmjs.org";
const packages = [
  "core",
  "grid-layout",
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
    alpha?: string;
    beta?: string;
    latest?: string;
  };
};

const PUBLISH_VERIFICATION_DELAY_MS = 10_000;

type FlagSpec = {
  name: string;
  expectsValue?: boolean;
  description: string;
};

const FLAGS: FlagSpec[] = [
  {
    name: "--tag",
    expectsValue: true,
    description: "Publish using a prerelease npm dist-tag (alpha or beta).",
  },
  {
    name: "--package",
    expectsValue: true,
    description: `Publish a single package instead of all packages. One of: ${packages.join(", ")}.`,
  },
  {
    name: "--version-check",
    description: "Check published npm package versions without publishing.",
  },
  {
    name: "--debug",
    description: "Publish from the debug package output.",
  },
  {
    name: "--verbose",
    description: "Print complete command output when a command fails.",
  },
  {
    name: "--help",
    description: "Print this help message.",
  },
];

const printHelp = () => {
  console.log("Usage: npm run pub -- [options]\n\nOptions:");
  for (const flag of FLAGS) {
    const usage = flag.expectsValue ? `${flag.name} <value>` : flag.name;
    console.log(`  ${usage.padEnd(20)} ${flag.description}`);
  }
};

const assertKnownArguments = () => {
  const args = process.argv.slice(2);
  const valueFlagNames = FLAGS.filter((flag) => flag.expectsValue).map(
    (flag) => flag.name,
  );
  const knownFlagNames = FLAGS.map((flag) => flag.name);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (valueFlagNames.includes(arg)) {
      i++; // consume the value that follows
      continue;
    }
    const isKnownFlag =
      knownFlagNames.includes(arg) ||
      valueFlagNames.some((name) => arg.startsWith(`${name}=`));
    if (!isKnownFlag) {
      console.error(`Unknown argument: "${arg}"\n`);
      printHelp();
      process.exit(1);
    }
  }
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

if (getArgument("--help") !== undefined) {
  printHelp();
  process.exit(0);
}

assertKnownArguments();

const debug = getArgument("--debug") !== undefined;
const verbose = getArgument("--verbose") !== undefined;
const publishTag = getArgument("--tag", true);
const versionCheck = getArgument("--version-check") !== undefined;
const packageArgument = getArgument("--package", true);

if (publishTag && !["alpha", "beta"].includes(publishTag)) {
  throw Error(`Unsupported publish tag "${publishTag}". Use alpha or beta.`);
}

if (packageArgument && !packages.includes(packageArgument as PackageName)) {
  throw Error(
    `Unsupported package "${packageArgument}". Use one of: ${packages.join(", ")}.`,
  );
}

const targetPackages: readonly PackageName[] = packageArgument
  ? [packageArgument as PackageName]
  : packages;

const readManifest = (filePath: string) =>
  readJson(filePath) as PackageManifest;

const readDistVersion = (packageName: PackageName) => {
  const filePath = `dist/${packageName}/package.json`;
  return fs.existsSync(filePath)
    ? readManifest(filePath).version
    : "unavailable";
};

const assertDistMatchesSource = (packageNames: readonly PackageName[]) => {
  const mismatches = packageNames.flatMap((packageName) => {
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
    `npm publish --registry ${registry} --access public${publishTag ? ` --tag ${publishTag}` : ""
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
      alphaVersion: undefined,
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
    alphaVersion: metadata["dist-tags"]?.alpha,
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

const runVersionCheck = async (packageNames: readonly PackageName[]) => {
  const results = await Promise.allSettled(
    packageNames.map((packageName) => checkPackageVersion(packageName)),
  );
  const rows = results.map((result, index) => {
    const packageName = packageNames[index];
    if (result.status === "fulfilled") {
      return {
        package: result.value.name,
        "npm alpha": result.value.alphaVersion ?? "unavailable",
        "npm beta": result.value.betaVersion ?? "unavailable",
        "npm latest": result.value.latestVersion ?? "unavailable",
        "package.json": result.value.version,
        "dist/package.json": result.value.distVersion,
      };
    }
    return {
      package: packageName,
      "npm alpha": "unavailable",
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
  packageNames: readonly string[],
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
  const results = await runVersionCheck(targetPackages);
  const failures = results.filter(({ status }) => status === "rejected");
  if (failures.length > 0) {
    throw Error(`${failures.length} version check(s) failed`);
  }
} else {
  const packageNameSuffix = debug ? "-debug" : "";
  assertDistMatchesSource(targetPackages);
  const publishResults = await Promise.allSettled(
    targetPackages.map((packageName) =>
      publishPackage(packageName, packageNameSuffix),
    ),
  );
  reportResults("publish", publishResults, targetPackages);

  const publishedPackages = targetPackages.filter(
    (_, index) => publishResults[index].status === "fulfilled",
  );
  if (publishedPackages.length > 0) {
    await new Promise((resolve) =>
      setTimeout(resolve, PUBLISH_VERIFICATION_DELAY_MS),
    );
  }
  const versionCheckResults = await runVersionCheck(targetPackages);

  const failures = [...publishResults, ...versionCheckResults].filter(
    ({ status }) => status === "rejected",
  );
  if (failures.length > 0) {
    throw Error(`${failures.length} package operation(s) failed`);
  }
}
