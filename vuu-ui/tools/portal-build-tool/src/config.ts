import { readFileSync } from "node:fs";
import path from "node:path";

export type PortalBuildMode = "local" | "remote";

export type JsonValue =
  | boolean
  | null
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

export interface SharedDependencyConfig {
  requiredVersion?: string | false;
  singleton?: boolean;
  strictVersion?: boolean;
}

export interface ModuleFederationConfig {
  name: string;
  remoteType?: string;
  remotes?: Record<string, string | Record<string, JsonValue>>;
  shared?: Record<string, SharedDependencyConfig>;
}

export interface BuildVariantConfig {
  entry?: string;
  output?: string;
  manifest?: JsonObject;
  moduleFederation?: Partial<ModuleFederationConfig>;
}

export interface PortalBuildConfig {
  version: 1;
  paths: {
    entries: {
      local?: string;
      remote: string;
    };
    htmlTemplate: string;
    output: string;
    preEntry?: string;
  };
  manifest: {
    filename: string;
    local?: JsonObject;
    remote: JsonObject;
  };
  moduleFederation: ModuleFederationConfig;
  builds?: Partial<Record<PortalBuildMode, BuildVariantConfig>>;
  cssInline?: false | { exclude?: string[]; include?: string[] };
}

export interface LoadedPortalBuildConfig {
  config: PortalBuildConfig;
  configPath: string;
  root: string;
}

export interface PortalBuildPlan {
  configPath: string;
  entry: string;
  htmlTemplate: string;
  manifest: {
    filename: string;
    value: JsonObject;
  };
  mode: PortalBuildMode;
  moduleFederation: ModuleFederationConfig & {
    shared: Record<string, SharedDependencyConfig>;
  };
  outputRoot: string;
  preEntry?: string;
  root: string;
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const invalidConfig = (property: string, message: string): never => {
  throw new Error(`Invalid portal build config: ${property} ${message}`);
};

const requireString = (
  value: unknown,
  property: string,
): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    invalidConfig(property, "must be a non-empty string");
  }
  return value as string;
};

const validateManifest = (value: unknown, property: string): JsonObject => {
  if (!isObject(value)) {
    invalidConfig(property, "must be a JSON object");
  }
  return value as JsonObject;
};

const validateShared = (
  value: unknown,
  property: string,
): Record<string, SharedDependencyConfig> => {
  if (!isObject(value)) {
    invalidConfig(property, "must be an object");
  }
  const shared = value as Record<string, unknown>;

  for (const [dependency, declaration] of Object.entries(shared)) {
    if (!isObject(declaration)) {
      invalidConfig(`${property}.${dependency}`, "must be an object");
    }
    const declarationObject = declaration as Record<string, unknown>;
    if (
      declarationObject.requiredVersion !== undefined &&
      declarationObject.requiredVersion !== false &&
      typeof declarationObject.requiredVersion !== "string"
    ) {
      invalidConfig(
        `${property}.${dependency}.requiredVersion`,
        'must be a string, "package", "package:<name>", or false',
      );
    }
    for (const option of ["singleton", "strictVersion"] as const) {
      if (
        declarationObject[option] !== undefined &&
        typeof declarationObject[option] !== "boolean"
      ) {
        invalidConfig(`${property}.${dependency}.${option}`, "must be boolean");
      }
    }
  }

  return value as Record<string, SharedDependencyConfig>;
};

const validateModuleFederation = (
  value: unknown,
  property: string,
  requireName = true,
): ModuleFederationConfig => {
  if (!isObject(value)) {
    invalidConfig(property, "must be an object");
  }
  const moduleFederation = value as Record<string, unknown>;
  const name =
    moduleFederation.name === undefined
      ? undefined
      : requireString(moduleFederation.name, `${property}.name`);
  if (requireName && !name) {
    invalidConfig(`${property}.name`, "must be a non-empty string");
  }

  if (moduleFederation.remoteType !== undefined) {
    requireString(moduleFederation.remoteType, `${property}.remoteType`);
  }
  if (moduleFederation.remotes !== undefined && !isObject(moduleFederation.remotes)) {
    invalidConfig(`${property}.remotes`, "must be an object");
  }

  return {
    ...(name ? { name } : {}),
    ...(moduleFederation.remoteType
      ? { remoteType: moduleFederation.remoteType as string }
      : {}),
    ...(moduleFederation.remotes
      ? {
          remotes: moduleFederation.remotes as ModuleFederationConfig["remotes"],
        }
      : {}),
    shared: validateShared(
      moduleFederation.shared ?? {},
      `${property}.shared`,
    ),
  } as ModuleFederationConfig;
};

const validateVariant = (
  value: unknown,
  property: string,
): BuildVariantConfig => {
  if (!isObject(value)) {
    invalidConfig(property, "must be an object");
  }
  const variantValue = value as Record<string, unknown>;
  const variant: BuildVariantConfig = {};
  if (variantValue.entry !== undefined) {
    variant.entry = requireString(variantValue.entry, `${property}.entry`);
  }
  if (variantValue.output !== undefined) {
    variant.output = requireString(variantValue.output, `${property}.output`);
  }
  if (variantValue.manifest !== undefined) {
    variant.manifest = validateManifest(
      variantValue.manifest,
      `${property}.manifest`,
    );
  }
  if (variantValue.moduleFederation !== undefined) {
    variant.moduleFederation = validateModuleFederation(
      variantValue.moduleFederation,
      `${property}.moduleFederation`,
      false,
    );
  }
  return variant;
};

export const parsePortalBuildConfig = (
  value: unknown,
): PortalBuildConfig => {
  if (!isObject(value)) {
    throw new Error("Invalid portal build config: expected a JSON object");
  }
  const configValue = value as Record<string, unknown>;
  if (configValue.version !== 1) {
    invalidConfig("version", "must be 1");
  }
  if (!isObject(configValue.paths)) {
    invalidConfig("paths", "must be an object");
  }
  const paths = configValue.paths as Record<string, unknown>;
  if (!isObject(paths.entries)) {
    invalidConfig("paths.entries", "must be an object");
  }
  const entries = paths.entries as Record<string, unknown>;
  const remoteEntry = requireString(
    entries.remote,
    "paths.entries.remote",
  );
  const localEntry =
    entries.local === undefined
      ? undefined
      : requireString(entries.local, "paths.entries.local");

  if (!isObject(configValue.manifest)) {
    invalidConfig("manifest", "must be an object");
  }
  const manifest = configValue.manifest as Record<string, unknown>;

  const config: PortalBuildConfig = {
    version: 1,
    paths: {
      entries: {
        remote: remoteEntry,
        ...(localEntry ? { local: localEntry } : {}),
      },
      htmlTemplate: requireString(
        paths.htmlTemplate,
        "paths.htmlTemplate",
      ),
      output: requireString(paths.output, "paths.output"),
      ...(paths.preEntry === undefined
        ? {}
        : { preEntry: requireString(paths.preEntry, "paths.preEntry") }),
    },
    manifest: {
      filename: requireString(manifest.filename, "manifest.filename"),
      local:
        manifest.local === undefined
          ? undefined
          : validateManifest(manifest.local, "manifest.local"),
      remote: validateManifest(manifest.remote, "manifest.remote"),
    },
    moduleFederation: validateModuleFederation(
      configValue.moduleFederation,
      "moduleFederation",
    ),
  };

  if (configValue.builds !== undefined) {
    if (!isObject(configValue.builds)) {
      invalidConfig("builds", "must be an object");
    }
    const builds = configValue.builds as Record<string, unknown>;
    config.builds = {};
    for (const mode of ["local", "remote"] as const) {
      if (builds[mode] !== undefined) {
        config.builds[mode] = validateVariant(
          builds[mode],
          `builds.${mode}`,
        );
      }
    }
  }

  if (configValue.cssInline !== undefined) {
    if (configValue.cssInline !== false && !isObject(configValue.cssInline)) {
      invalidConfig("cssInline", "must be false or an object");
    }
    if (isObject(configValue.cssInline)) {
      for (const option of ["include", "exclude"] as const) {
        if (
          configValue.cssInline[option] !== undefined &&
          (!Array.isArray(configValue.cssInline[option]) ||
            configValue.cssInline[option].some(
              (item) => typeof item !== "string",
            ))
        ) {
          invalidConfig(`cssInline.${option}`, "must be an array of strings");
        }
      }
    }
    config.cssInline = configValue.cssInline as PortalBuildConfig["cssInline"];
  }

  return config;
};

export const loadPortalBuildConfig = (
  configPath = "portal-build.json",
): LoadedPortalBuildConfig => {
  const absoluteConfigPath = path.resolve(configPath);
  let value: unknown;
  try {
    value = JSON.parse(readFileSync(absoluteConfigPath, "utf8")) as unknown;
  } catch (error) {
    throw new Error(`Unable to read portal build config ${absoluteConfigPath}`, {
      cause: error,
    });
  }

  return {
    config: parsePortalBuildConfig(value),
    configPath: absoluteConfigPath,
    root: path.dirname(absoluteConfigPath),
  };
};

const readPackageJson = (packageJsonPath: string): PackageJson => {
  try {
    return JSON.parse(readFileSync(packageJsonPath, "utf8")) as PackageJson;
  } catch (error) {
    throw new Error(`Unable to read package.json ${packageJsonPath}`, {
      cause: error,
    });
  }
};

const findDependencyVersion = (
  dependency: string,
  packageJson: PackageJson,
  packageJsonPath: string,
): string => {
  const version = [
    packageJson.dependencies?.[dependency],
    packageJson.devDependencies?.[dependency],
    packageJson.optionalDependencies?.[dependency],
    packageJson.peerDependencies?.[dependency],
  ].find((candidate): candidate is string => candidate !== undefined);
  if (!version) {
    throw new Error(
      `Shared dependency ${dependency} is not declared in ${packageJsonPath}`,
    );
  }
  return version;
};

export const resolveSharedDependencies = (
  shared: Record<string, SharedDependencyConfig>,
  packageJsonPath: string,
): Record<string, SharedDependencyConfig> => {
  const packageJson = readPackageJson(packageJsonPath);
  return Object.fromEntries(
    Object.entries(shared).map(([dependency, declaration]) => {
      const requiredVersion = declaration.requiredVersion;
      if (
        typeof requiredVersion !== "string" ||
        !requiredVersion.startsWith("package")
      ) {
        return [dependency, declaration];
      }
      const packageDependency =
        requiredVersion === "package"
          ? dependency
          : requiredVersion.slice("package:".length);
      if (!packageDependency) {
        invalidConfig(
          `moduleFederation.shared.${dependency}.requiredVersion`,
          'must be "package" or "package:<name>"',
        );
      }
      return [
        dependency,
        {
          ...declaration,
          requiredVersion: findDependencyVersion(
            packageDependency,
            packageJson,
            packageJsonPath,
          ),
        },
      ];
    }),
  );
};

const mergeModuleFederation = (
  base: ModuleFederationConfig,
  variant: Partial<ModuleFederationConfig> | undefined,
  packageJsonPath: string,
): ModuleFederationConfig & {
  shared: Record<string, SharedDependencyConfig>;
} => {
  const merged = {
    ...base,
    ...variant,
    ...(base.remotes || variant?.remotes
      ? { remotes: { ...base.remotes, ...variant?.remotes } }
      : {}),
    shared: {
      ...base.shared,
      ...variant?.shared,
    },
  };
  return {
    ...merged,
    shared: resolveSharedDependencies(merged.shared ?? {}, packageJsonPath),
  };
};

export const createPortalBuildPlan = (
  loadedConfig: LoadedPortalBuildConfig,
  mode: PortalBuildMode = "remote",
): PortalBuildPlan => {
  const { config, configPath, root } = loadedConfig;
  const variant = config.builds?.[mode];
  const entry = variant?.entry ?? config.paths.entries[mode];
  if (!entry) {
    throw new Error(`No ${mode} entry is configured in ${configPath}`);
  }

  return {
    configPath,
    entry: path.resolve(root, entry),
    htmlTemplate: path.resolve(root, config.paths.htmlTemplate),
    manifest: {
      filename: config.manifest.filename,
      value: variant?.manifest ?? config.manifest[mode] ?? config.manifest.remote,
    },
    mode,
    moduleFederation: mergeModuleFederation(
      config.moduleFederation,
      variant?.moduleFederation,
      path.join(root, "package.json"),
    ),
    outputRoot: path.resolve(root, variant?.output ?? config.paths.output),
    preEntry: config.paths.preEntry,
    root,
  };
};
