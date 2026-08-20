import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGES_ROOT = path.join(ROOT, "packages");
const VERSION_PATTERN =
  /^(\d+)\.(\d+)\.(\d+)(?:-(alpha|beta)\.(\d+))?$/;
const DEPENDENCY_SECTIONS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
] as const;

type PackageJson = {
  name?: string;
  version?: string;
  [key: string]: unknown;
};

type PackageInfo = {
  filePath: string;
  json: PackageJson;
};

const readJson = (filePath: string): PackageJson =>
  JSON.parse(fs.readFileSync(filePath, "utf8")) as PackageJson;

const writeJson = (filePath: string, json: PackageJson) => {
  fs.writeFileSync(filePath, `${JSON.stringify(json, null, 2)}\n`);
};

const findPackageJsonFiles = (directory: string): string[] => {
  const files: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist") continue;
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...findPackageJsonFiles(entryPath));
    } else if (entry.isFile() && entry.name === "package.json") {
      files.push(entryPath);
    }
  }
  return files;
};

const parseVersion = (version: string) => {
  const match = VERSION_PATTERN.exec(version);
  if (!match) {
    throw new Error(
      `Invalid version "${version}". Expected n.n.n, n.n.n-alpha.n, or n.n.n-beta.n.`,
    );
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    channel: match[4],
    prerelease: match[5] === undefined ? undefined : Number(match[5]),
  };
};

const incrementVersion = (version: string) => {
  const parsed = parseVersion(version);
  if (parsed.channel) {
    return `${parsed.major}.${parsed.minor}.${parsed.patch}-${parsed.channel}.${parsed.prerelease! + 1}`;
  }
  return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
};

const getRequestedVersion = () => {
  const versionArgument = process.argv.slice(2).find((argument) => {
    return argument === "--version" || argument.startsWith("--version=");
  });

  if (versionArgument === undefined) return undefined;
  if (versionArgument === "--version") {
    throw new Error("The --version option requires a value.");
  }
  return versionArgument.slice("--version=".length);
};

const reportMismatches = (
  packages: PackageInfo[],
  workspaceVersions: Map<string, string>,
) => {
  const versions = new Map<string, string[]>();
  for (const { filePath, json } of packages) {
    if (!json.name || !json.version) continue;
    const locations = versions.get(json.version) ?? [];
    locations.push(path.relative(ROOT, filePath));
    versions.set(json.version, locations);
  }

  if (versions.size > 1) {
    console.warn("Package version mismatches:");
    for (const [version, locations] of versions) {
      console.warn(`  ${version}: ${locations.join(", ")}`);
    }
  }

  for (const { filePath, json } of packages) {
    for (const section of DEPENDENCY_SECTIONS) {
      const dependencies = json[section];
      if (!dependencies || typeof dependencies !== "object") continue;
      for (const [name, version] of Object.entries(
        dependencies as Record<string, unknown>,
      )) {
        const expected = workspaceVersions.get(name);
        if (expected && version !== expected) {
          console.warn(
            `Version reference mismatch: ${path.relative(ROOT, filePath)} ${section}.${name} is ${String(version)}, expected ${expected}`,
          );
        }
      }
    }
  }
};

const packageFiles = findPackageJsonFiles(PACKAGES_ROOT).sort();
const packages = packageFiles.map((filePath) => ({
  filePath,
  json: readJson(filePath),
}));
const workspaceVersions = new Map(
  packages
    .filter(({ json }) => json.name?.startsWith("@vuu-ui/") && json.version)
    .map(({ json }) => [json.name!, json.version!]),
);

if (workspaceVersions.size === 0) {
  throw new Error(`No versioned @vuu-ui packages found in ${PACKAGES_ROOT}`);
}

reportMismatches(packages, workspaceVersions);

const requestedVersion = getRequestedVersion();
const currentVersion = packages.find(({ json }) => json.version)?.json.version;
const version = requestedVersion ?? incrementVersion(currentVersion!);
parseVersion(version);

for (const { filePath, json } of packages) {
  if (json.version) {
    json.version = version;
  }

  for (const section of DEPENDENCY_SECTIONS) {
    const dependencies = json[section];
    if (!dependencies || typeof dependencies !== "object") continue;
    for (const name of Object.keys(dependencies as Record<string, unknown>)) {
      if (workspaceVersions.has(name)) {
        (dependencies as Record<string, unknown>)[name] = version;
      }
    }
  }

  writeJson(filePath, json);
}

console.log(`Updated @vuu-ui package versions to ${version}`);
