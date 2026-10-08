import type { ModuleConfig } from "@heswell/module-admin/contracts";
import {
  parseRemoteModuleConfig,
  REMOTE_MODULE_CONFIG_FILE,
  RemoteModuleConfigError,
  type RemoteModuleConfig,
  remoteModuleConfigUrl,
} from "@vuu-ui/core";

/**
 * Remote checks run in the browser: they show whether the remote can be
 * loaded from where the admin is, not whether every user can load it.
 */

export const MANIFEST_FILE = "mf-manifest.json";
export const CONFIG_FILE = REMOTE_MODULE_CONFIG_FILE;

/**
 * The remote's `config.json`, which every remote must publish. It names the
 * Vuu server the remote uses, if any; the portal won't load a remote without
 * a valid config.
 */
export type RemoteConfigResult =
  | ({ status: "loaded" } & RemoteModuleConfig)
  | { status: "invalid"; error: string };

export type ManifestResult =
  | { status: "checking" }
  | {
      status: "loaded";
      checkedAt: number;
      elapsedMs: number;
      /** Federation name, the scope the remote registers itself under. */
      name: string;
      /** Exposed component names, without the leading `./`. */
      exposes: string[];
      config: RemoteConfigResult;
    }
  | { status: "unreachable"; checkedAt: number; error: string };

export type RemoteCheckStatus = "checking" | "ok" | "mismatch" | "unreachable";

export interface RemoteCheckItem {
  ok: boolean;
  label: string;
  detail: string;
}

export interface RemoteCheck {
  status: RemoteCheckStatus;
  summary: string;
  checkedAt?: number;
  elapsedMs?: number;
  exposes: string[];
  /** Checks against the remote's mf-manifest.json. */
  items: RemoteCheckItem[];
  /** Checks against the remote's config.json, once the remote is reached. */
  configItems: RemoteCheckItem[];
  /** The remote's config.json, once the remote has been reached. */
  config?: RemoteConfigResult;
}

export const manifestUrl = (mfUrl: string) =>
  `${mfUrl.replace(/\/+$/, "")}/${MANIFEST_FILE}`;

const stripDotSlash = (name: string) => name.replace(/^\.\//, "");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/** Reads the parts of a module federation manifest the check relies on. */
export const parseManifest = (
  json: unknown,
): { name: string; exposes: string[] } => {
  if (!isRecord(json) || typeof json.name !== "string") {
    throw new Error("Not a module federation manifest");
  }
  const exposes = Array.isArray(json.exposes)
    ? json.exposes.flatMap((expose) =>
        isRecord(expose)
          ? [
              stripDotSlash(
                typeof expose.path === "string"
                  ? expose.path
                  : typeof expose.name === "string"
                    ? expose.name
                    : "",
              ),
            ].filter(Boolean)
          : [],
      )
    : [];
  return { exposes, name: json.name };
};

const describeFetchError = (cause: unknown) =>
  cause instanceof TypeError
    ? "Network or CORS error"
    : cause instanceof Error
      ? cause.message
      : String(cause);

/** Fetches and validates the remote's config.json, as the portal does. */
export const fetchRemoteConfig = async (
  mfUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<RemoteConfigResult> => {
  try {
    const response = await fetchImpl(remoteModuleConfigUrl(mfUrl), {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`${CONFIG_FILE} returned HTTP ${response.status}`);
    }
    let json: unknown;
    try {
      json = await response.json();
    } catch {
      // Static servers commonly answer a missing file with index.html.
      throw new Error(`${CONFIG_FILE} is missing or not valid JSON`);
    }
    const { vuu } = parseRemoteModuleConfig(json, CONFIG_FILE);
    return vuu ? { status: "loaded", vuu } : { status: "loaded" };
  } catch (cause) {
    return {
      error:
        cause instanceof RemoteModuleConfigError
          ? `${CONFIG_FILE}: ${cause.reason}`
          : describeFetchError(cause),
      status: "invalid",
    };
  }
};

export const fetchManifest = async (
  mfUrl: string,
  fetchImpl: typeof fetch = fetch,
  now: () => number = Date.now,
): Promise<ManifestResult> => {
  const started = now();
  // Fetched alongside the manifest; only reported if the remote is reachable.
  const config = fetchRemoteConfig(mfUrl, fetchImpl);
  try {
    const response = await fetchImpl(manifestUrl(mfUrl), {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`${MANIFEST_FILE} returned HTTP ${response.status}`);
    }
    const { exposes, name } = parseManifest(await response.json());
    const checkedAt = now();
    return {
      checkedAt,
      config: await config,
      elapsedMs: checkedAt - started,
      exposes,
      name,
      status: "loaded",
    };
  } catch (cause) {
    return {
      checkedAt: now(),
      error: describeFetchError(cause),
      status: "unreachable",
    };
  }
};

const hostOf = (url: string) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

/** The config.json check, followed by the Vuu connection it declares. */
const configItems = (config: RemoteConfigResult): RemoteCheckItem[] => {
  if (config.status === "invalid") {
    return [{ detail: config.error, label: "Config", ok: false }];
  }
  const { vuu } = config;
  return [
    {
      detail: vuu
        ? `${CONFIG_FILE} · Vuu server ${vuu.connectionId}`
        : `${CONFIG_FILE} · uses the portal's Vuu connection`,
      label: "Config",
      ok: true,
    },
    ...(vuu
      ? [
          { detail: vuu.connectionId, label: "Connection id", ok: true },
          ...(vuu.websocketUrl
            ? [{ detail: vuu.websocketUrl, label: "WebSocket URL", ok: true }]
            : []),
          ...(vuu.restUrl
            ? [{ detail: vuu.restUrl, label: "Auth (REST) URL", ok: true }]
            : []),
        ]
      : []),
  ];
};

/**
 * Compares a module's federation settings with its remote's manifest, and
 * checks the remote's config.json.
 */
export const compareRemote = (
  module: Pick<ModuleConfig, "mfComponent" | "mfScope" | "mfUrl">,
  manifest: ManifestResult | undefined,
): RemoteCheck | undefined => {
  if (!manifest) return undefined;
  if (manifest.status === "checking") {
    return {
      configItems: [],
      exposes: [],
      items: [],
      status: "checking",
      summary: "Checking remote…",
    };
  }
  if (manifest.status === "unreachable") {
    return {
      checkedAt: manifest.checkedAt,
      configItems: [],
      exposes: [],
      items: [
        { detail: manifest.error, label: "Manifest not loaded", ok: false },
      ],
      status: "unreachable",
      summary: `Remote not reachable from this browser at ${hostOf(module.mfUrl)}`,
    };
  }
  const component = stripDotSlash(module.mfComponent);
  const scopeOk = manifest.name === module.mfScope;
  const exposeOk = manifest.exposes.includes(component);
  const items: RemoteCheckItem[] = [
    {
      detail: `${MANIFEST_FILE} · ${manifest.elapsedMs} ms`,
      label: "Manifest loaded",
      ok: true,
    },
    {
      detail: scopeOk
        ? `${module.mfScope} matches manifest`
        : `manifest declares ${manifest.name}`,
      label: "Scope",
      ok: scopeOk,
    },
    {
      detail: exposeOk
        ? `./${component}`
        : `./${component} is not exposed (${manifest.exposes.map((name) => `./${name}`).join(", ") || "none"})`,
      label: "Exposes",
      ok: exposeOk,
    },
  ];
  const { config } = manifest;
  const configOk = config.status === "loaded";
  const ok = scopeOk && exposeOk && configOk;
  return {
    checkedAt: manifest.checkedAt,
    config,
    configItems: configItems(config),
    elapsedMs: manifest.elapsedMs,
    exposes: manifest.exposes,
    items,
    status: ok ? "ok" : "mismatch",
    summary: ok
      ? "Reachable from this browser"
      : !scopeOk
        ? `Remote declares scope ${manifest.name}, not ${module.mfScope}`
        : !exposeOk
          ? `Remote does not expose ./${component}`
          : `Remote ${CONFIG_FILE} is missing or invalid`,
  };
};
