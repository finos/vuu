import type { ModuleId } from "./ModuleServerMap";

export type VuuServerPresence =
  /** Connected, or reconnected. */
  | "online"
  /** Authenticating or connecting, on the first attempt. */
  | "connecting"
  /** Reconnecting after having been online. */
  | "degraded"
  /** Failed, or disconnected and being probed. */
  | "offline"
  /** Token exchange denied for this user. */
  | "unauthorized"
  /** The module's `config.json` failed to load or is invalid. */
  | "unavailable"
  /** Not monitored, config still loading, or not otherwise connected. */
  | "unknown";

export interface VuuServerStatusDetail {
  /** Short, user-facing, e.g. "Server not responding". */
  reason: string;
  /** Underlying message, e.g. a token exchange failure. */
  error?: string;
  /** Host of the websocket or config URL. Never includes a token. */
  endpoint?: string;
  /** True while a connection attempt or probe is in flight. */
  checking?: boolean;
  /** Epoch ms, if the server was online earlier in this session. */
  lastOnlineAt?: number;
  /** Epoch ms of the last connect, probe or config load. */
  lastAttemptAt?: number;
  /** Epoch ms of the next scheduled probe; absent when not retrying. */
  nextAttemptAt?: number;
}

export interface VuuServerStatus {
  connectionId: string;
  presence: VuuServerPresence;
  /** Epoch ms of the last presence change. */
  since: number;
  monitored: boolean;
  notificationsSupported?: boolean;
  /** Set for offline, unauthorized and unavailable. */
  detail?: VuuServerStatusDetail;
}

/** Presences that stop the user opening an application. */
export const isUnavailablePresence = (presence: VuuServerPresence) =>
  presence === "offline" ||
  presence === "unauthorized" ||
  presence === "unavailable";

export interface ServerMonitorOptions {
  /** Default true. When false, servers are observed but never acquired. */
  enabled?: boolean;
  /** Default 8. Excludes the portal server. */
  maxMonitoredServers?: number;
  /** Default 30_000. */
  releaseDelayMs?: number;
  /** Default 60_000. */
  probeIntervalMs?: number;
  /** Default 150. */
  staggerMs?: number;
}

/** The status source that presence hooks and nav items read. */
export interface VuuServerStatusSource {
  getStatus(connectionId: string): VuuServerStatus;
  getModuleStatus(moduleId: ModuleId): VuuServerStatus;
  getStatuses(): ReadonlyMap<string, VuuServerStatus>;
  subscribe(listener: () => void): () => void;
  /** Reconnect now, or reload a failed module config. */
  retryModule(moduleId: ModuleId): void;
  setDisplayOrder(moduleIds: ModuleId[]): void;
  setOpenModule(moduleId: ModuleId | undefined): void;
  setVisibleModules(moduleIds: Iterable<ModuleId>): void;
  start(): void;
  stop(): void;
}

export const endpointHost = (url?: string) => {
  if (!url) {
    return undefined;
  }
  try {
    return new URL(url).host || undefined;
  } catch {
    return undefined;
  }
};

const sameDetail = (a?: VuuServerStatusDetail, b?: VuuServerStatusDetail) =>
  a === b ||
  (a !== undefined &&
    b !== undefined &&
    a.reason === b.reason &&
    a.error === b.error &&
    a.endpoint === b.endpoint &&
    a.checking === b.checking &&
    a.lastOnlineAt === b.lastOnlineAt &&
    a.lastAttemptAt === b.lastAttemptAt &&
    a.nextAttemptAt === b.nextAttemptAt);

/**
 * Returns `previous` when nothing changed, so that subscribers comparing
 * by identity don't re-render. `since` moves only when presence changes.
 */
export const nextStatus = (
  previous: VuuServerStatus | undefined,
  next: Omit<VuuServerStatus, "since">,
  now: number,
): VuuServerStatus => {
  if (
    previous &&
    previous.presence === next.presence &&
    previous.monitored === next.monitored &&
    previous.notificationsSupported === next.notificationsSupported &&
    sameDetail(previous.detail, next.detail)
  ) {
    return previous;
  }
  const status: VuuServerStatus = {
    ...next,
    since:
      previous && previous.presence === next.presence ? previous.since : now,
  };
  if (status.detail === undefined) {
    delete status.detail;
  }
  if (status.notificationsSupported === undefined) {
    delete status.notificationsSupported;
  }
  return status;
};
