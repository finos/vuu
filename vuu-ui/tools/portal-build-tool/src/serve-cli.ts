#!/usr/bin/env node
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import net from "node:net";
import os from "node:os";
import path from "node:path";

interface PortalService {
  name: string;
  port: number;
  outputDirectory: string;
}

interface PortalServiceConfig {
  name: string;
  port: number;
  directory: string;
}

interface PortalServeConfig {
  defaultHost: string;
  hosts: PortalServiceConfig[];
  remotes: PortalServiceConfig[];
}

interface StartOptions {
  configPath: string;
  host?: string;
  help?: boolean;
  hostOnly: boolean;
  remotes?: string[];
}

interface RunningService {
  child: ChildProcess;
  closed: Promise<void>;
  service: PortalService;
}

interface ManagedService {
  name: string;
  pid: number;
  port: number;
  outputDirectory: string;
}

interface ManagedServicesState {
  services: ManagedService[];
}

interface ControlPaths {
  controlAddress: string;
  statePath: string;
}

const getControlPaths = (absoluteConfigPath: string): ControlPaths => {
  const configId = createHash("sha256")
    .update(absoluteConfigPath)
    .digest("hex")
    .slice(0, 20);
  return {
    controlAddress:
      process.platform === "win32"
        ? `\\\\.\\pipe\\vuu-portal-${configId}`
        : path.join(os.tmpdir(), `vuu-portal-${configId}.sock`),
    statePath: path.join(os.tmpdir(), `vuu-portal-${configId}.json`),
  };
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseServiceConfig = (
  value: unknown,
  name: string,
): PortalServiceConfig => {
  if (!isObject(value)) {
    throw new Error(`Invalid portal serve config: ${name} must be an object`);
  }

  const serviceName = value.name;
  const port = value.port;
  const directory = value.directory;
  if (typeof serviceName !== "string" || serviceName.trim().length === 0) {
    throw new Error(`Invalid portal serve config: ${name}.name is required`);
  }
  if (
    typeof port !== "number" ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new Error(`Invalid portal serve config: ${name}.port must be 1-65535`);
  }
  if (typeof directory !== "string" || directory.trim().length === 0) {
    throw new Error(`Invalid portal serve config: ${name}.directory is required`);
  }

  return {
    name: serviceName,
    port,
    directory,
  };
};

const loadConfig = (configPath: string) => {
  const absoluteConfigPath = path.resolve(process.cwd(), configPath);
  const configDirectory = path.dirname(absoluteConfigPath);
  const value: unknown = JSON.parse(readFileSync(absoluteConfigPath, "utf8"));
  if (
    !isObject(value) ||
    typeof value.defaultHost !== "string" ||
    !Array.isArray(value.hosts) ||
    !Array.isArray(value.remotes)
  ) {
    throw new Error(
      `Invalid portal serve config at ${absoluteConfigPath}: expected defaultHost, hosts, and remotes`,
    );
  }

  const hosts = value.hosts.map((host, index) =>
    parseServiceConfig(host, `hosts[${index}]`),
  );
  const remotes = value.remotes.map((remote, index) =>
    parseServiceConfig(remote, `remotes[${index}]`),
  );
  const names = [...hosts, ...remotes].map(({ name }) => name);
  if (new Set(names).size !== names.length) {
    throw new Error("Portal serve config service names must be unique");
  }
  if (!hosts.some(({ name }) => name === value.defaultHost)) {
    throw new Error(
      `Portal serve config defaultHost "${value.defaultHost}" does not match a configured host`,
    );
  }

  return {
    absoluteConfigPath,
    config: {
      defaultHost: value.defaultHost,
      hosts,
      remotes,
    } satisfies PortalServeConfig,
  };
};

const selectServices = (
  config: PortalServeConfig,
  configDirectory: string,
  options: StartOptions,
): PortalService[] => {
  const hostName = options.host ?? config.defaultHost;
  const host = config.hosts.find(({ name }) => name === hostName);
  if (!host) {
    throw new Error(`No host named "${hostName}" is configured`);
  }

  const remoteNames =
    options.hostOnly
      ? []
      : (options.remotes ?? config.remotes.map(({ name }) => name));
  if (new Set(remoteNames).size !== remoteNames.length) {
    throw new Error("Remote names must not be repeated");
  }

  const remotes = remoteNames.map((name) => {
    const remote = config.remotes.find((configured) => configured.name === name);
    if (!remote) {
      throw new Error(`No remote named "${name}" is configured`);
    }
    return remote;
  });

  const services = [host, ...remotes].map(({ name, port, directory }) => ({
    name,
    port,
    outputDirectory: path.resolve(configDirectory, directory),
  }));
  const ports = new Set(services.map(({ port }) => port));
  if (ports.size !== services.length) {
    throw new Error("Selected portal services contain duplicate ports");
  }
  return services;
};

const sleep = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const readManagedState = (
  { statePath }: ControlPaths,
): ManagedServicesState | undefined => {
  try {
    const state: unknown = JSON.parse(readFileSync(statePath, "utf8"));
    if (
      typeof state !== "object" ||
      state === null ||
      !("services" in state) ||
      !Array.isArray(state.services)
    ) {
      throw new Error("invalid state shape");
    }

    return state as ManagedServicesState;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return undefined;
    }
    throw new Error(
      `Could not read portal serve state at ${statePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

const getProcessCommand = (pid: number): string => {
  const command =
    process.platform === "win32" ? "powershell.exe" : "ps";
  const args =
    process.platform === "win32"
      ? [
          "-NoProfile",
          "-NonInteractive",
          "-Command",
          `(Get-CimInstance Win32_Process -Filter "ProcessId = ${pid}").CommandLine`,
        ]
      : ["-p", String(pid), "-o", "command="];

  try {
    return execFileSync(command, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch (error) {
    if (
      process.platform !== "win32" &&
      error &&
      typeof error === "object" &&
      "status" in error &&
      error.status === 1
    ) {
      return "";
    }
    throw new Error(
      `Could not inspect portal serve process ${pid}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

const isManagedProcessRunning = (service: ManagedService): boolean => {
  const command = getProcessCommand(service.pid);
  return (
    command.includes("serve") &&
    command.includes(`--listen ${service.port}`) &&
    command.includes(service.outputDirectory)
  );
};

const signalManagedProcess = (
  service: ManagedService,
  signal: NodeJS.Signals,
) => {
  if (!isManagedProcessRunning(service)) return;
  try {
    process.kill(service.pid, signal);
  } catch (error) {
    if (
      !error ||
      typeof error !== "object" ||
      !("code" in error) ||
      error.code !== "ESRCH"
    ) {
      throw error;
    }
  }
};

const removeStaleState = ({ controlAddress, statePath }: ControlPaths) => {
  if (existsSync(statePath)) unlinkSync(statePath);
  if (process.platform !== "win32" && existsSync(controlAddress)) {
    unlinkSync(controlAddress);
  }
};

const stopOrphanedProcesses = async (
  controlPaths: ControlPaths,
): Promise<void> => {
  const state = readManagedState(controlPaths);
  if (!state) {
    removeStaleState(controlPaths);
    console.log("Portal services are not running.");
    return;
  }

  const services = state.services.filter(isManagedProcessRunning);
  if (services.length === 0) {
    removeStaleState(controlPaths);
    console.log("Portal services are not running.");
    return;
  }

  for (const service of services) {
    signalManagedProcess(service, "SIGTERM");
  }

  const deadline = Date.now() + 5000;
  let remaining = services.filter(isManagedProcessRunning);
  while (remaining.length > 0 && Date.now() < deadline) {
    await sleep(100);
    remaining = remaining.filter(isManagedProcessRunning);
  }
  for (const service of remaining) {
    signalManagedProcess(service, "SIGKILL");
  }
  const forcedDeadline = Date.now() + 5000;
  while (remaining.length > 0 && Date.now() < forcedDeadline) {
    await sleep(100);
    remaining = remaining.filter(isManagedProcessRunning);
  }
  if (remaining.length > 0) {
    throw new Error(
      `Could not stop portal server process(es): ${remaining.map(({ pid }) => pid).join(", ")}`,
    );
  }

  removeStaleState(controlPaths);
  console.log(`Stopped ${services.length} orphaned portal server(s).`);
};

const isAlreadyRunning = (
  { controlAddress }: ControlPaths,
): Promise<boolean> =>
  new Promise<boolean>((resolve, reject) => {
    const connection = net.createConnection(controlAddress);
    connection.once("connect", () => {
      connection.destroy();
      resolve(true);
    });
    connection.once("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "ECONNREFUSED" || error.code === "ENOENT") {
        resolve(false);
      } else {
        reject(error);
      }
    });
  });

const stop = async (configPath: string): Promise<void> => {
  const controlPaths = getControlPaths(
    path.resolve(process.cwd(), configPath),
  );
  const supervisorFound = await new Promise<boolean>((resolve, reject) => {
    const connection = net.createConnection(controlPaths.controlAddress);
    let response = "";

    connection.setEncoding("utf8");
    connection.once("connect", () => connection.write("stop\n"));
    connection.on("data", (chunk: string) => {
      response += chunk;
    });
    connection.once("end", () => {
      console.log(response.trim() || "Portal services stopped.");
      resolve(true);
    });
    connection.once("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "ECONNREFUSED" || error.code === "ENOENT") {
        resolve(false);
      } else {
        reject(error);
      }
    });
  });

  if (!supervisorFound) {
    await stopOrphanedProcesses(controlPaths);
    return;
  }

  const deadline = Date.now() + 10000;
  while (existsSync(controlPaths.statePath) && Date.now() < deadline) {
    await sleep(100);
  }
  if (existsSync(controlPaths.statePath)) {
    throw new Error("Timed out waiting for portal servers to stop.");
  }
};

const start = async (options: StartOptions): Promise<void> => {
  const { absoluteConfigPath, config } = loadConfig(options.configPath);
  const controlPaths = getControlPaths(absoluteConfigPath);
  const services = selectServices(
    config,
    path.dirname(absoluteConfigPath),
    options,
  );

  for (const { name, outputDirectory } of services) {
    if (
      !existsSync(path.join(outputDirectory, "index.html")) ||
      !existsSync(path.join(outputDirectory, "serve.json"))
    ) {
      throw new Error(
        `Missing built output for ${name} at ${outputDirectory}. Build the portal example first.`,
      );
    }
  }

  if (await isAlreadyRunning(controlPaths)) {
    throw new Error("Portal services are already running; use npm run portal:stop.");
  }
  const previousState = readManagedState(controlPaths);
  if (previousState?.services.some(isManagedProcessRunning)) {
    throw new Error(
      "Portal servers from a previous run are still active; use npm run portal:stop.",
    );
  }
  if (previousState) unlinkSync(controlPaths.statePath);
  if (
    process.platform !== "win32" &&
    existsSync(controlPaths.controlAddress)
  ) {
    unlinkSync(controlPaths.controlAddress);
  }

  const controlServer = net.createServer();
  const children: RunningService[] = [];
  let stopping = false;
  let shutdownResolve!: () => void;
  const shutdownComplete = new Promise<void>((resolve) => {
    shutdownResolve = resolve;
  });

  const shutdown = async (
    exitCode: number,
    message?: string,
  ): Promise<void> => {
    if (stopping) return shutdownComplete;
    stopping = true;
    process.exitCode = exitCode;
    if (message) console.error(message);

    const controlServerClosed = new Promise<void>((resolve) => {
      controlServer.close(() => resolve());
    });
    for (const { child } of children) {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill("SIGTERM");
      }
    }

    await Promise.race([
      Promise.all(children.map(({ closed }) => closed)),
      sleep(5000),
    ]);

    for (const { child } of children) {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill("SIGKILL");
      }
    }
    await Promise.all(children.map(({ closed }) => closed));
    await controlServerClosed;

    removeStaleState(controlPaths);
    shutdownResolve();
    return shutdownComplete;
  };

  const listen = (): Promise<void> =>
    new Promise<void>((resolve, reject) => {
      controlServer.once("error", reject);
      controlServer.listen(controlPaths.controlAddress, () => {
        controlServer.off("error", reject);
        resolve();
      });
    });

  await listen();
  if (process.platform !== "win32") {
    chmodSync(controlPaths.controlAddress, 0o600);
  }

  controlServer.on("connection", (connection) => {
    connection.once("data", (data) => {
      if (data.toString().trim() === "stop") {
        connection.end("Stopping all portal servers.\n", () => {
          void shutdown(0);
        });
      } else {
        connection.end("running\n");
      }
    });
  });
  controlServer.on("error", (error) => {
    void shutdown(1, `Portal control socket failed: ${error.message}`);
  });

  process.once("SIGINT", () => void shutdown(130));
  process.once("SIGTERM", () => void shutdown(143));

  try {
    const persistState = () => {
      const managedServices = children.flatMap(({ child, service }) =>
        child.pid === undefined
          ? []
          : [
              {
                name: service.name,
                pid: child.pid,
                port: service.port,
                outputDirectory: service.outputDirectory,
              },
            ],
      );
      writeFileSync(
        controlPaths.statePath,
        JSON.stringify({ services: managedServices }),
        { mode: 0o600 },
      );
      if (process.platform !== "win32") {
        chmodSync(controlPaths.statePath, 0o600);
      }
    };

    for (const service of services) {
      const child = spawn(
        "serve",
        ["--listen", String(service.port), service.outputDirectory],
        {
          cwd: process.cwd(),
          stdio: "inherit",
        },
      );
      const closed = new Promise<void>((resolve) => {
        child.once("close", (code, signal) => {
          if (!stopping) {
            void shutdown(
              signal === "SIGINT" ? 130 : signal === "SIGTERM" ? 143 : 1,
              signal
                ? undefined
                : `${service.name} serve process exited (${code ?? "unknown"}).`,
            );
          }
          resolve();
        });
      });
      child.once("error", (error) => {
        void shutdown(1, `Could not start ${service.name}: ${error.message}`);
      });
      children.push({ child, closed, service });
      persistState();
    }

    const waitForService = async ({
      child,
      service,
    }: Pick<RunningService, "child" | "service">): Promise<void> => {
      const deadline = Date.now() + 15000;
      while (Date.now() < deadline) {
        if (stopping || child.exitCode !== null || child.signalCode !== null) {
          throw new Error(`${service.name} exited before becoming available`);
        }
        try {
          const response = await fetch(`http://localhost:${service.port}/`, {
            signal: AbortSignal.timeout(1000),
          });
          if (response.ok) {
            await response.body?.cancel();
            console.log(`${service.name} ready at http://localhost:${service.port}`);
            return;
          }
        } catch {
          // Retry until the server is ready or the startup deadline expires.
        }
        await sleep(200);
      }
      throw new Error(`${service.name} did not start on port ${service.port}`);
    };

    await Promise.all(
      children.map(({ child, service }) => waitForService({ child, service })),
    );
  } catch (error) {
    await shutdown(
      1,
      error instanceof Error ? error.message : String(error),
    );
  }

  if (!stopping) {
    console.log("Portal services are running. Use npm run portal:stop to stop them.");
  }
  await shutdownComplete;
};

const usage = `Usage:
  portal-serve start [--config <path>] [--host <name>] [--remotes <name,...>]
  portal-serve start --host-only
  portal-serve stop [--config <path>]

Configuration paths are relative to the current working directory. Output directories are relative to the config file.`;

const parseStartOptions = (args: string[]): StartOptions => {
  const options: StartOptions = {
    configPath: "portal-serve.config.json",
    hostOnly: false,
  };
  let remotesSelected = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    const value = args[index + 1];
    if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else if (argument === "--host-only") {
      options.hostOnly = true;
    } else if (argument === "--config" || argument === "--host") {
      if (!value || value.startsWith("--")) {
        throw new Error(`${argument} requires a value`);
      }
      if (argument === "--config") {
        options.configPath = value;
      } else {
        options.host = value;
      }
      index += 1;
    } else if (argument === "--remotes" || argument === "--remote") {
      if (!value || value.startsWith("--")) {
        throw new Error(`${argument} requires a value`);
      }
      const names =
        argument === "--remote"
          ? [value]
          : value.split(",").map((name) => name.trim());
      if (names.some((name) => name.length === 0)) {
        throw new Error(`${argument} requires one or more remote names`);
      }
      options.remotes ??= [];
      options.remotes.push(...names);
      remotesSelected = true;
      index += 1;
    } else {
      throw new Error(`Unknown portal:serve option: ${argument}\n\n${usage}`);
    }
  }

  if (options.hostOnly && remotesSelected) {
    throw new Error("--host-only cannot be combined with --remote or --remotes");
  }
  return options;
};

const parseStopConfigPath = (
  args: string[],
): { configPath: string; help: boolean } => {
  let configPath = "portal-serve.config.json";
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--help" || argument === "-h") {
      return { configPath, help: true };
    }
    if (argument !== "--config") {
      throw new Error(`Unknown portal:stop option: ${argument}`);
    }
    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error("--config requires a value");
    }
    configPath = value;
    index += 1;
  }
  return { configPath, help: false };
};

const [command, ...args] = process.argv.slice(2);
try {
  if (command === "start") {
    const startOptions = parseStartOptions(args);
    if (startOptions.help) {
      console.log(usage);
    } else {
      await start(startOptions);
    }
  } else if (command === "stop") {
    const stopOptions = parseStopConfigPath(args);
    if (stopOptions.help) {
      console.log("Usage: portal-serve stop [--config <path>]");
    } else {
      await stop(stopOptions.configPath);
    }
  } else {
    throw new Error(usage);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
