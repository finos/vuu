import { readFileSync } from "node:fs";
import path from "node:path";
import {
  createPortalBuildPlan,
  loadPortalBuildConfig,
  type LoadedPortalBuildConfig,
  type PortalBuildMode,
  type PortalBuildPlan,
  type PortalBuildTarget,
  type SharedDependencyConfig,
} from "./config.js";
import { buildPortal, type BuildPortalOptions } from "./build.js";

export interface PortalBuildAllTargetConfig {
  name: string;
  packageDir: string;
  config: string;
  target: PortalBuildTarget;
  shared?: Record<string, SharedDependencyConfig>;
}

export interface PortalBuildAllConfig {
  version: 1;
  shared?: Record<string, SharedDependencyConfig>;
  targets: PortalBuildAllTargetConfig[];
}

export interface LoadedPortalBuildAllConfig {
  config: PortalBuildAllConfig;
  configPath: string;
  root: string;
}

export interface PlannedPortalBuildTarget {
  name: string;
  packageDir: string;
  configPath: string;
  loadedConfig: LoadedPortalBuildConfig;
  mode: PortalBuildMode;
  plan: PortalBuildPlan;
}

export interface PortalBuildAllPlan {
  configPath: string;
  mode: PortalBuildMode;
  targets: PlannedPortalBuildTarget[];
}

export interface BuildPortalAllOptions
  extends Pick<BuildPortalOptions, "rsdoctor"> {
  configPath?: string;
  mode?: PortalBuildMode;
  targetName?: string;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const requireString = (value: unknown, property: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(
      `Invalid portal build-all config: ${property} must be a non-empty string`,
    );
  }
  return value;
};

const validateShared = (
  value: unknown,
  property: string,
): Record<string, SharedDependencyConfig> => {
  if (!isObject(value)) {
    throw new Error(
      `Invalid portal build-all config: ${property} must be an object`,
    );
  }
  const shared: Record<string, SharedDependencyConfig> = {};
  for (const [dependency, declaration] of Object.entries(value)) {
    if (!isObject(declaration)) {
      throw new Error(
        `Invalid portal build-all config: ${property}.${dependency} must be an object`,
      );
    }
    if (
      declaration.requiredVersion !== undefined &&
      declaration.requiredVersion !== false &&
      typeof declaration.requiredVersion !== "string"
    ) {
      throw new Error(
        `Invalid portal build-all config: ${property}.${dependency}.requiredVersion must be a string or false`,
      );
    }
    for (const option of ["singleton", "strictVersion"] as const) {
      if (
        declaration[option] !== undefined &&
        typeof declaration[option] !== "boolean"
      ) {
        throw new Error(
          `Invalid portal build-all config: ${property}.${dependency}.${option} must be boolean`,
        );
      }
    }
    const requiredVersion = declaration.requiredVersion as
      | string
      | false
      | undefined;
    const singleton = declaration.singleton as boolean | undefined;
    const strictVersion = declaration.strictVersion as boolean | undefined;
    shared[dependency] = {
      ...(requiredVersion === undefined
        ? {}
        : { requiredVersion }),
      ...(singleton === undefined ? {} : { singleton }),
      ...(strictVersion === undefined
        ? {}
        : { strictVersion }),
    };
  }
  return shared;
};

export const parsePortalBuildAllConfig = (
  value: unknown,
): PortalBuildAllConfig => {
  if (!isObject(value)) {
    throw new Error(
      "Invalid portal build-all config: expected a JSON object",
    );
  }
  if (value.version !== 1) {
    throw new Error("Invalid portal build-all config: version must be 1");
  }
  if (!Array.isArray(value.targets) || value.targets.length === 0) {
    throw new Error(
      "Invalid portal build-all config: targets must be a non-empty array",
    );
  }
  const shared =
    value.shared === undefined
      ? undefined
      : validateShared(value.shared, "shared");

  const names = new Set<string>();
  const targets = value.targets.map((target, index) => {
    const property = `targets[${index}]`;
    if (!isObject(target)) {
      throw new Error(
        `Invalid portal build-all config: ${property} must be an object`,
      );
    }
    const name = requireString(target.name, `${property}.name`);
    if (names.has(name)) {
      throw new Error(
        `Invalid portal build-all config: duplicate target name "${name}"`,
      );
    }
    names.add(name);
    const targetType = requireString(
      target.target,
      `${property}.target`,
    ) as PortalBuildTarget;
    if (targetType !== "host" && targetType !== "remote-module") {
      throw new Error(
        `Invalid portal build-all config: ${property}.target must be "host" or "remote-module"`,
      );
    }
    return {
      name,
      packageDir: requireString(target.packageDir, `${property}.packageDir`),
      config: requireString(target.config, `${property}.config`),
      target: targetType,
      ...(target.shared === undefined
        ? {}
        : { shared: validateShared(target.shared, `${property}.shared`) }),
    };
  });

  return { version: 1, ...(shared ? { shared } : {}), targets };
};

export const loadPortalBuildAllConfig = (
  configPath = "portal-build-all.json",
): LoadedPortalBuildAllConfig => {
  const absoluteConfigPath = path.resolve(configPath);
  let value: unknown;
  try {
    value = JSON.parse(readFileSync(absoluteConfigPath, "utf8")) as unknown;
  } catch (error) {
    throw new Error(
      `Unable to read portal build-all config ${absoluteConfigPath}`,
      { cause: error },
    );
  }

  return {
    config: parsePortalBuildAllConfig(value),
    configPath: absoluteConfigPath,
    root: path.dirname(absoluteConfigPath),
  };
};

const getTargetMode = (
  target: PortalBuildAllTargetConfig,
  requestedMode: PortalBuildMode,
): PortalBuildMode => (target.target === "host" ? requestedMode : "remote");

const mergeSharedDependencies = (
  ...sources: Array<Record<string, SharedDependencyConfig> | undefined>
): Record<string, SharedDependencyConfig> => {
  const mergedShared: Record<string, SharedDependencyConfig> = {};
  for (const source of sources) {
    for (const [dependency, declaration] of Object.entries(source ?? {})) {
      mergedShared[dependency] = {
        ...(mergedShared[dependency] ?? {}),
        ...declaration,
      };
    }
  }
  return mergedShared;
};

export const createPortalBuildAllPlan = (
  loadedConfig: LoadedPortalBuildAllConfig,
  mode: PortalBuildMode = "remote",
  targetName?: string,
): PortalBuildAllPlan => {
  const configuredTargets = targetName
    ? loadedConfig.config.targets.filter(({ name }) => name === targetName)
    : loadedConfig.config.targets;

  if (targetName && configuredTargets.length === 0) {
    throw new Error(
      `No portal build target named "${targetName}" is configured in ${loadedConfig.configPath}`,
    );
  }

  if (
    targetName &&
    mode === "local" &&
    configuredTargets[0]?.target !== "host"
  ) {
    throw new Error(
      `Local mode is only supported for a host target; "${targetName}" is a remote module`,
    );
  }

  const targets = configuredTargets.map((target) => {
    const packageDir = path.resolve(loadedConfig.root, target.packageDir);
    const configPath = path.resolve(packageDir, target.config);
    let applicationConfig: LoadedPortalBuildConfig;
    try {
      applicationConfig = loadPortalBuildConfig(configPath);
    } catch (error) {
      throw new Error(
        `Unable to load portal build target "${target.name}" from ${configPath}`,
        { cause: error },
      );
    }

    const actualTarget = applicationConfig.config.target ?? "host";
    if (actualTarget !== target.target) {
      throw new Error(
        `Portal build target "${target.name}" declares ${target.target} but ${configPath} declares ${actualTarget}`,
      );
    }

    const targetMode = getTargetMode(target, mode);
    try {
      const mergedShared = mergeSharedDependencies(
        loadedConfig.config.shared,
        applicationConfig.config.moduleFederation.shared,
        target.shared,
      );
      const effectiveConfig: LoadedPortalBuildConfig = {
        ...applicationConfig,
        config: {
          ...applicationConfig.config,
          moduleFederation: {
            ...applicationConfig.config.moduleFederation,
            shared: mergedShared,
          },
        },
      };
      return {
        name: target.name,
        packageDir,
        configPath,
        loadedConfig: effectiveConfig,
        mode: targetMode,
        plan: createPortalBuildPlan(effectiveConfig, targetMode),
      };
    } catch (error) {
      throw new Error(
        `Unable to plan portal build target "${target.name}" from ${configPath}`,
        { cause: error },
      );
    }
  });

  return {
    configPath: loadedConfig.configPath,
    mode,
    targets,
  };
};

export const buildPortalAll = async ({
  configPath = "portal-build-all.json",
  mode = "remote",
  targetName,
  rsdoctor = false,
}: BuildPortalAllOptions = {}): Promise<void> => {
  const loadedConfig = loadPortalBuildAllConfig(configPath);
  const plan = createPortalBuildAllPlan(loadedConfig, mode, targetName);

  for (const target of plan.targets) {
    console.log(`\nBuilding ${target.name} (${target.mode})...`);
    try {
      await buildPortal({
        configPath: target.configPath,
        loadedConfig: target.loadedConfig,
        mode: target.mode,
        rsdoctor,
      });
    } catch (error) {
      throw new Error(
        `Portal build target "${target.name}" failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { cause: error },
      );
    }
  }

  console.log("\nPortal builds completed successfully.");
};
