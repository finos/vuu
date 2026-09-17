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

const packages = [
  { bridgeName: "user-admin", sourceName: "user-admin" },
  { bridgeName: "data", sourceName: "data" },
  { bridgeName: "vuu-server", sourceName: "vuu-server" },
];
const bridgeDirectory = resolve(uiDirectory, ".local-packages");

const packageDirectory = async (sourceName) => {
  const directory = resolve(source, "packages", sourceName);
  try {
    if ((await stat(resolve(directory, "package.json"))).isFile()) {
      return directory;
    }
  } catch {
    // The message below identifies the complete missing package path.
  }
  throw new Error(
    `No ${sourceName} package found at ${directory}. Expected packages/${sourceName}/package.json.`,
  );
};

const refreshLink = async (name, target) => {
  const bridge = resolve(bridgeDirectory, name);
  try {
    const status = await lstat(bridge);
    if (!status.isSymbolicLink()) {
      throw new Error(
        `Refusing to replace ${bridge}: it exists and is not a symbolic link.`,
      );
    }
    const existingTarget = await realpath(
      resolve(bridgeDirectory, await readlink(bridge)),
    );
    if (existingTarget === (await realpath(target))) {
      console.log(`${name} bridge already points to ${target}`);
      return;
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

  await symlink(target, bridge, "dir");
  console.log(`Linked ${bridge} -> ${target}`);
};

await mkdir(bridgeDirectory, { recursive: true });
for (const { bridgeName, sourceName } of packages) {
  await refreshLink(bridgeName, await packageDirectory(sourceName));
}
