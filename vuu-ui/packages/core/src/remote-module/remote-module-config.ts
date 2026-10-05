import type { RemoteModuleConnection } from "@vuu-ui/vuu-data-types";

export const REMOTE_MODULE_CONFIG_FILE = "config.json";

/**
 * Runtime configuration published by every remote module as `config.json`
 * beside its `mf-manifest.json`. A remote that uses a Vuu server publishes
 * the server's `connectionId`, `restUrl` and `websocketUrl`; a remote that
 * doesn't publishes `{}`.
 */
export interface RemoteModuleConfig {
  vuu?: RemoteModuleConnection;
}

export class RemoteModuleConfigError extends Error {
  constructor(
    readonly url: string,
    /** Why the config was rejected, without the URL. */
    readonly reason: string,
    options?: ErrorOptions,
  ) {
    super(`Invalid remote module config ${url}: ${reason}`, options);
    this.name = "RemoteModuleConfigError";
  }
}

export const remoteModuleConfigUrl = (mfUrl: string) =>
  `${mfUrl.replace(/\/+$/, "")}/${REMOTE_MODULE_CONFIG_FILE}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const optionalString = (
  json: Record<string, unknown>,
  key: string,
  url: string,
) => {
  const value = json[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "string" || value.trim() === "") {
    throw new RemoteModuleConfigError(url, `${key} must be a non-empty string`);
  }
  return value;
};

/** Validates the parsed contents of a remote module's `config.json`. */
export const parseRemoteModuleConfig = (
  json: unknown,
  url: string,
): RemoteModuleConfig => {
  if (!isRecord(json)) {
    throw new RemoteModuleConfigError(url, "must be a JSON object");
  }
  const connectionId = optionalString(json, "connectionId", url);
  const restUrl = optionalString(json, "restUrl", url);
  const websocketUrl = optionalString(json, "websocketUrl", url);

  if (connectionId === undefined) {
    if (restUrl !== undefined || websocketUrl !== undefined) {
      throw new RemoteModuleConfigError(
        url,
        "connectionId is required when restUrl or websocketUrl is set",
      );
    }
    return {};
  }
  if ((restUrl === undefined) !== (websocketUrl === undefined)) {
    throw new RemoteModuleConfigError(
      url,
      "restUrl and websocketUrl must be set together",
    );
  }
  return {
    vuu: {
      connectionId,
      ...(restUrl === undefined ? {} : { restUrl }),
      ...(websocketUrl === undefined ? {} : { websocketUrl }),
    },
  };
};

const configs = new Map<string, Promise<RemoteModuleConfig>>();

const fetchRemoteModuleConfig = async (
  url: string,
): Promise<RemoteModuleConfig> => {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (cause) {
    throw new RemoteModuleConfigError(url, "could not be fetched", { cause });
  }
  if (!response.ok) {
    throw new RemoteModuleConfigError(
      url,
      `request failed with status ${response.status}`,
    );
  }
  let json: unknown;
  try {
    json = await response.json();
  } catch (cause) {
    // Static servers commonly answer a missing file with index.html.
    throw new RemoteModuleConfigError(
      url,
      "is not valid JSON, check that the remote publishes it",
      { cause },
    );
  }
  return parseRemoteModuleConfig(json, url);
};

/**
 * Loads a remote module's `config.json` from its `mfUrl`. The result is
 * cached per URL; a failed load is forgotten so that it can be retried.
 */
export const loadRemoteModuleConfig = (
  mfUrl: string,
): Promise<RemoteModuleConfig> => {
  const url = remoteModuleConfigUrl(mfUrl);
  let config = configs.get(url);
  if (config === undefined) {
    config = fetchRemoteModuleConfig(url);
    const pending = config;
    pending.catch(() => {
      if (configs.get(url) === pending) {
        configs.delete(url);
      }
    });
    configs.set(url, pending);
  }
  return config;
};

export const forgetRemoteModuleConfig = (mfUrl: string) => {
  configs.delete(remoteModuleConfigUrl(mfUrl));
};
