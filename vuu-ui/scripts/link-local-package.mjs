import { lstat, mkdir, readFile, rm, stat, symlink } from "node:fs/promises";
import { resolve, relative, join } from "node:path";

const SUPPORTED_PACKAGES = new Set(["user-admin", "module-admin"]);
const args = process.argv.slice(2);
const sourceRootArg = args.at(-1);
const requestedPackages =
  sourceRootArg && !SUPPORTED_PACKAGES.has(sourceRootArg)
    ? args.slice(0, -1)
    : args;
const sourceRoot = sourceRootArg && !SUPPORTED_PACKAGES.has(sourceRootArg)
  ? sourceRootArg
  : process.env.VUU_WEBSOCKET_ROOT;

if (
  !sourceRoot ||
  requestedPackages.length === 0 ||
  requestedPackages.some((packageName) => !SUPPORTED_PACKAGES.has(packageName))
) {
  throw new Error(
    "Usage: node scripts/link-local-package.mjs <user-admin|module-admin> [...] /path/to/vuu-websocket",
  );
}

const localPackagesRoot = resolve(".local-packages");
const websocketRoot = resolve(sourceRoot);

await stat(websocketRoot);
await mkdir(localPackagesRoot, { recursive: true });

for (const packageName of requestedPackages) {
  const packageRoot = join(websocketRoot, "packages", packageName);
  const packageJsonPath = join(packageRoot, "package.json");
  await stat(packageRoot);
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
  if (packageJson.name !== `@heswell/${packageName}`) {
    throw new Error(
      `Expected ${packageJsonPath} to name @heswell/${packageName}, found ${String(packageJson.name)}`,
    );
  }

  const linkPath = join(localPackagesRoot, packageName);
  try {
    const linkStat = await lstat(linkPath);
    if (!linkStat.isSymbolicLink()) {
      throw new Error(
        `Refusing to replace non-symlink local package path: ${linkPath}`,
      );
    }
    await rm(linkPath);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      // The link does not exist yet.
    } else {
      throw error;
    }
  }

  await symlink(relative(localPackagesRoot, packageRoot), linkPath, "dir");
  console.log(`Linked @heswell/${packageName}`);
}
