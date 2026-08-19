import { readFileSync } from "node:fs";
import path from "node:path";

export type PortalBuildMode = "local" | "remote";
export type PortalBuildTarget = "host" | "remote-module" | "application";

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
  dts?: boolean;
  exposes?: Record<string, string>;
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
  target?: PortalBuildTarget;
  paths: {
    entries?: {
      local?: string;
      remote: string;
    };
    entry?: string;
    htmlTemplate: string;
    output: string;
    assetPrefix?: string;
    publicPath?: string;
    preEntry?: string;
  };
  manifest?: {
    filename: string;
    local?: JsonObject;
    remote: JsonObject;
  };
  moduleFederation: ModuleFederationConfig;
  builds?: Partial<Record<PortalBuildMode, BuildVariantConfig>>;
  cssInline?: false | { exclude?: string[]; include?: string[] };
  html?: { title?: string };
  server?: { corsOrigins?: string[] };
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
  target: PortalBuildTarget;
  moduleFederation: ModuleFederationConfig & {
    shared: Record<string, SharedDependencyConfig>;
  };
  outputRoot: string;
  assetPrefix: string;
  publicPath?: string;
  exposes?: Record<string, string>;
  dts?: boolean;
  htmlTitle?: string;
  corsOrigins?: string[];
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

const validateExposes = (
  value: unknown,
  property: string,
): Record<string, string> => {
  if (!isObject(value)) {
    invalidConfig(property, "must be an object");
  }
  const exposeValues = value as Record<string, unknown>;
  const exposes: Record<string, string> = {};
  for (const [name, request] of Object.entries(exposeValues)) {
    exposes[name] = requireString(request, `${property}.${name}`);
  }
  return exposes;
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
  if (
    moduleFederation.dts !== undefined &&
    typeof moduleFederation.dts !== "boolean"
  ) {
    invalidConfig(`${property}.dts`, "must be boolean");
  }
  if (moduleFederation.remotes !== undefined && !isObject(moduleFederation.remotes)) {
    invalidConfig(`${property}.remotes`, "must be an object");
  }

  return {
    ...(name ? { name } : {}),
    ...(moduleFederation.dts === undefined
      ? {}
      : { dts: moduleFederation.dts as boolean }),
    ...(moduleFederation.exposes === undefined
      ? {}
      : {
          exposes: validateExposes(
            moduleFederation.exposes,
            `${property}.exposes`,
          ),
        }),
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
  const target = (configValue.target ?? "host") as PortalBuildTarget;
  if (
    target !== "host" &&
    target !== "remote-module" &&
    target !== "application"
  ) {
    invalidConfig(
      "target",
      'must be "host", "remote-module", or "application"',
    );
  }
  const entries = isObject(paths.entries)
    ? (paths.entries as Record<string, unknown>)
    : undefined;
  const remoteEntry =
    entries === undefined
      ? undefined
      : requireString(entries.remote, "paths.entries.remote");
  const localEntry =
    entries?.local === undefined
      ? undefined
      : requireString(entries.local, "paths.entries.local");
  const entry =
    paths.entry === undefined
      ? undefined
      : requireString(paths.entry, "paths.entry");
  if (target === "host" && (!entries || !remoteEntry)) {
    invalidConfig("paths.entries", "must define a remote entry for host builds");
  }
  if ((target === "remote-module" || target === "application") && !entry) {
    invalidConfig(
      "paths.entry",
      `must define an entry for ${target} builds`,
    );
  }

  const manifest =
    configValue.manifest === undefined
      ? undefined
      : (() => {
          if (!isObject(configValue.manifest)) {
            invalidConfig("manifest", "must be an object");
          }
          return configValue.manifest as Record<string, unknown>;
        })();
  if (target === "host" && !manifest) {
    invalidConfig("manifest", "must be an object");
  }

  const config: PortalBuildConfig = {
    version: 1,
    target,
    paths: {
      ...(entries && remoteEntry
        ? {
            entries: {
              remote: remoteEntry,
              ...(localEntry ? { local: localEntry } : {}),
            },
          }
        : {}),
      ...(entry ? { entry } : {}),
      htmlTemplate: requireString(
        paths.htmlTemplate,
        "paths.htmlTemplate",
      ),
      output: requireString(paths.output, "paths.output"),
      assetPrefix:
        paths.assetPrefix === undefined
          ? "./"
          : requireString(paths.assetPrefix, "paths.assetPrefix"),
      ...(paths.preEntry === undefined
        ? {}
        : { preEntry: requireString(paths.preEntry, "paths.preEntry") }),
    },
    ...(manifest
      ? {
          manifest: {
            filename: requireString(manifest.filename, "manifest.filename"),
            local:
              manifest.local === undefined
                ? undefined
                : validateManifest(manifest.local, "manifest.local"),
            remote: validateManifest(manifest.remote, "manifest.remote"),
          },
        }
      : {}),
    moduleFederation: validateModuleFederation(
      configValue.moduleFederation,
      "moduleFederation",
    ),
  };

  if (target === "remote-module") {
    if (!config.moduleFederation.exposes) {
      invalidConfig(
        "moduleFederation.exposes",
        "must define exposed modules for remote-module builds",
      );
    }
    config.paths.publicPath = requireString(
      paths.publicPath,
      "paths.publicPath",
    );
  }

  if (configValue.html !== undefined) {
    if (!isObject(configValue.html)) {
      invalidConfig("html", "must be an object");
    }
    const html = configValue.html as Record<string, unknown>;
    config.html = {
      ...(html.title === undefined
        ? {}
        : { title: requireString(html.title, "html.title") }),
    };
  }

  if (configValue.server !== undefined) {
    if (!isObject(configValue.server)) {
      invalidConfig("server", "must be an object");
    }
    const server = configValue.server as Record<string, unknown>;
    if (
      server.corsOrigins !== undefined &&
      (!Array.isArray(server.corsOrigins) ||
        server.corsOrigins.some((origin) => typeof origin !== "string"))
    ) {
      invalidConfig("server.corsOrigins", "must be an array of strings");
    }
    config.server = {
      ...(server.corsOrigins
        ? { corsOrigins: server.corsOrigins as string[] }
        : {}),
    };
  }

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
  const target = config.target ?? "host";
  if (target === "remote-module") {
    return {
      configPath,
      entry: path.resolve(root, config.paths.entry as string),
      htmlTemplate: path.resolve(root, config.paths.htmlTemplate),
      manifest: { filename: "", value: {} },
      mode,
      target,
      moduleFederation: mergeModuleFederation(
        config.moduleFederation,
        undefined,
        path.join(root, "package.json"),
      ),
      outputRoot: path.resolve(root, config.paths.output),
      assetPrefix: config.paths.assetPrefix ?? "./",
      publicPath: config.paths.publicPath,
      exposes: config.moduleFederation.exposes,
      dts: config.moduleFederation.dts ?? false,
      htmlTitle: config.html?.title,
      corsOrigins: config.server?.corsOrigins,
      preEntry: config.paths.preEntry,
      root,
    };
  }
  if (target === "application") {
    return {
      configPath,
      entry: path.resolve(root, config.paths.entry as string),
      htmlTemplate: path.resolve(root, config.paths.htmlTemplate),
      manifest: { filename: "", value: {} },
      mode,
      target,
      moduleFederation: mergeModuleFederation(
        config.moduleFederation,
        undefined,
        path.join(root, "package.json"),
      ),
      outputRoot: path.resolve(root, config.paths.output),
      assetPrefix: config.paths.assetPrefix ?? "./",
      publicPath: undefined,
      exposes: undefined,
      dts: undefined,
      htmlTitle: config.html?.title,
      corsOrigins: config.server?.corsOrigins,
      preEntry: config.paths.preEntry,
      root,
    };
  }
  const variant = config.builds?.[mode];
  const entry = variant?.entry ?? config.paths.entries?.[mode];
  if (!entry) {
    throw new Error(`No ${mode} entry is configured in ${configPath}`);
  }

  return {
    configPath,
    entry: path.resolve(root, entry),
    htmlTemplate: path.resolve(root, config.paths.htmlTemplate),
    manifest: {
      filename: config.manifest?.filename ?? "",
      value:
        variant?.manifest ??
        config.manifest?.[mode] ??
        config.manifest?.remote ??
        {},
    },
    mode,
    target,
    moduleFederation: mergeModuleFederation(
      config.moduleFederation,
      variant?.moduleFederation,
      path.join(root, "package.json"),
    ),
    outputRoot: path.resolve(root, variant?.output ?? config.paths.output),
    assetPrefix: config.paths.assetPrefix ?? "./",
    publicPath: undefined,
    exposes: undefined,
    dts: undefined,
    htmlTitle: config.html?.title,
    corsOrigins: config.server?.corsOrigins,
    preEntry: config.paths.preEntry,
    root,
  };
};
