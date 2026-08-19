import type { ModuleConfig } from "@heswell/module-admin/contracts";

/**
 * Remote checks run in the browser: they show whether the remote can be
 * loaded from where the admin is, not whether every user can load it.
 */

export const MANIFEST_FILE = "mf-manifest.json";

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
  items: RemoteCheckItem[];
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

export const fetchManifest = async (
  mfUrl: string,
  fetchImpl: typeof fetch = fetch,
  now: () => number = Date.now,
): Promise<ManifestResult> => {
  const started = now();
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
      elapsedMs: checkedAt - started,
      exposes,
      name,
      status: "loaded",
    };
  } catch (cause) {
    return {
      checkedAt: now(),
      error:
        cause instanceof TypeError
          ? "Network or CORS error"
          : cause instanceof Error
            ? cause.message
            : String(cause),
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

/** Compares a module's federation settings with its remote's manifest. */
export const compareRemote = (
  module: Pick<ModuleConfig, "mfComponent" | "mfScope" | "mfUrl">,
  manifest: ManifestResult | undefined,
): RemoteCheck | undefined => {
  if (!manifest) return undefined;
  if (manifest.status === "checking") {
    return {
      exposes: [],
      items: [],
      status: "checking",
      summary: "Checking remote…",
    };
  }
  if (manifest.status === "unreachable") {
    return {
      checkedAt: manifest.checkedAt,
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
  const ok = scopeOk && exposeOk;
  return {
    checkedAt: manifest.checkedAt,
    elapsedMs: manifest.elapsedMs,
    exposes: manifest.exposes,
    items,
    status: ok ? "ok" : "mismatch",
    summary: ok
      ? "Reachable from this browser"
      : !scopeOk
        ? `Remote declares scope ${manifest.name}, not ${module.mfScope}`
        : `Remote does not expose ./${component}`,
  };
};
