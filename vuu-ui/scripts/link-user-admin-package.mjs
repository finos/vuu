import {
  lstat,
  mkdir,
  readlink,
  realpath,
  stat,
  symlink,
  unlink,
} from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const uiDirectory = resolve(scriptDirectory, "..");
const source = process.argv[2] ?? process.env.VUU_WEBSOCKET_ROOT;

if (!source) {
  throw new Error(
    "Provide the vuu-websocket root as the first argument or set VUU_WEBSOCKET_ROOT.",
  );
}

const packageDirectory = resolve(source, "packages/user-admin");
try {
  if (!(await stat(resolve(packageDirectory, "package.json"))).isFile()) {
    throw new Error("package.json is not a file");
  }
} catch {
  throw new Error(
    `No user-admin package found at ${packageDirectory}. Expected packages/user-admin/package.json.`,
  );
}

const bridgeDirectory = resolve(uiDirectory, ".local-packages");
const bridge = resolve(bridgeDirectory, "user-admin");
await mkdir(bridgeDirectory, { recursive: true });

try {
  const status = await lstat(bridge);
  if (!status.isSymbolicLink()) {
    throw new Error(
      `Refusing to replace ${bridge}: it exists and is not a symbolic link.`,
    );
  }
  const target = await realpath(
    resolve(bridgeDirectory, await readlink(bridge)),
  );
  if (target === (await realpath(packageDirectory))) {
    console.log(`User-admin bridge already points to ${packageDirectory}`);
    process.exit(0);
  }
  await unlink(bridge);
} catch (error) {
  if (
    !error ||
    typeof error !== "object" ||
    !("code" in error) ||
    error.code !== "ENOENT"
  ) {
    throw error;
  }
}

await symlink(packageDirectory, bridge, "dir");
console.log(`Linked ${bridge} -> ${packageDirectory}`);
