import type { AuthHandler } from "../auth/AuthHandler";
import {
  VuuTokenExchangeError,
  type VuuAuthTarget,
} from "../auth/VuuTokenExchange";
import { isNestedModule } from "../RemoteModuleDescriptor";
import type { RemoteModuleConnection } from "@vuu-ui/vuu-data-types";
import type { ModuleId, ModuleServerMap } from "./ModuleServerMap";
import {
  endpointHost,
  nextStatus,
  type ServerMonitorOptions,
  type VuuServerPresence,
  type VuuServerStatus,
  type VuuServerStatusSource,
} from "./server-status";
import type {
  VuuConnectionRegistry,
  VuuServerConnectionState,
} from "./VuuConnectionRegistry";

export const DEFAULT_SERVER_MONITOR_OPTIONS: Required<ServerMonitorOptions> = {
  enabled: true,
  maxMonitoredServers: 8,
  offlineAfterMs: 3_000,
  probeIntervalMs: 60_000,
  releaseDelayMs: 30_000,
  staggerMs: 150,
};

const REASON = {
  connectionLost: "Connection lost",
  notResponding: "Server not responding",
  unauthorized: "You don't have access to this application's server",
  unavailable: "Application configuration could not be loaded",
} as const;

type Scheduler = {
  clearTimeout: (handle: ReturnType<typeof setTimeout>) => void;
  setTimeout: (
    callback: () => void,
    ms: number,
  ) => ReturnType<typeof setTimeout>;
};

const defaultScheduler: Scheduler = {
  clearTimeout: (handle) => clearTimeout(handle),
  setTimeout: (callback, ms) => setTimeout(callback, ms),
};

/**
 * Shared by the Vuu and local monitors: combines each module's config
 * resolution with its server's status, and notifies subscribers.
 */
abstract class ServerStatusStore implements VuuServerStatusSource {
  protected readonly map: ModuleServerMap;
  protected readonly now: () => number;
  #listeners = new Set<() => void>();
  #moduleStatuses = new Map<ModuleId, VuuServerStatus>();
  #untrackedStatuses = new Map<string, VuuServerStatus>();
  #statuses: ReadonlyMap<string, VuuServerStatus> = new Map();
  #unsubscribeMap?: () => void;

  constructor(map: ModuleServerMap, now: () => number) {
    this.map = map;
    this.now = now;
  }

  protected abstract computeStatus(
    connectionId: string,
    previous?: VuuServerStatus,
  ): VuuServerStatus;

  /** Connection ids whose status is tracked, besides those in the map. */
  protected abstract trackedIds(): Iterable<string>;

  protected onMapChange() {
    this.refresh();
  }

  start() {
    this.#unsubscribeMap ??= this.map.subscribe(() => this.onMapChange());
    this.refresh();
  }

  stop() {
    this.#unsubscribeMap?.();
    this.#unsubscribeMap = undefined;
  }

  getStatus(connectionId: string): VuuServerStatus {
    const tracked = this.#statuses.get(connectionId);
    if (tracked) {
      return tracked;
    }
    // Cached so that repeated reads return the same object.
    const status = this.computeStatus(
      connectionId,
      this.#untrackedStatuses.get(connectionId),
    );
    this.#untrackedStatuses.set(connectionId, status);
    return status;
  }

  getStatuses() {
    return this.#statuses;
  }

  getModuleStatus(moduleId: ModuleId): VuuServerStatus {
    const previous = this.#moduleStatuses.get(moduleId);
    const resolution = this.map.get(moduleId);
    let status: VuuServerStatus;
    if (resolution.status === "resolved") {
      status = this.getStatus(resolution.connectionId);
    } else if (resolution.status === "loading") {
      status = nextStatus(
        previous,
        { connectionId: "", monitored: false, presence: "unknown" },
        this.now(),
      );
    } else {
      const { error, failedAt } = resolution;
      status = nextStatus(
        previous,
        {
          connectionId: "",
          detail: {
            endpoint: endpointHost(error.url),
            error: error.reason,
            lastAttemptAt: failedAt,
            reason: REASON.unavailable,
          },
          monitored: false,
          presence: "unavailable",
        },
        failedAt,
      );
    }
    this.#moduleStatuses.set(moduleId, status);
    return status;
  }

  subscribe = (listener: () => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  retry(_connectionId: string) {}
  abstract retryModule(moduleId: ModuleId): void;
  setDisplayOrder(_moduleIds: ModuleId[]) {}
  setOpenModule(_moduleId: ModuleId | undefined) {}
  setVisibleModules(_moduleIds: Iterable<ModuleId>) {}

  /** Recomputes every tracked status and notifies if any changed. */
  protected refresh() {
    const ids = new Set<string>(this.trackedIds());
    ids.add(this.map.portalConnectionId);
    for (const module of this.map.modules) {
      const resolution = this.map.get(module.id);
      if (resolution.status === "resolved") {
        ids.add(resolution.connectionId);
      }
    }
    let changed = ids.size !== this.#statuses.size;
    const statuses = new Map<string, VuuServerStatus>();
    for (const id of ids) {
      const previous = this.#statuses.get(id);
      const status = this.computeStatus(id, previous);
      statuses.set(id, status);
      changed ||= status !== previous;
    }
    if (changed) {
      this.#statuses = statuses;
    }
    // Connections read by id, e.g. a module's override connection.
    for (const [id, previous] of this.#untrackedStatuses) {
      if (statuses.has(id)) {
        this.#untrackedStatuses.delete(id);
      } else {
        this.#untrackedStatuses.set(id, this.computeStatus(id, previous));
      }
    }
    // Module statuses also depend on the map, which may have changed alone.
    for (const listener of this.#listeners) {
      listener();
    }
  }
}

interface ServerRecord {
  connectionId: string;
  failure?: {
    error?: Error;
    presence: Extract<VuuServerPresence, "offline" | "unauthorized">;
  };
  held: boolean;
  lastAttemptAt?: number;
  lastOnlineAt?: number;
  nextAttemptAt?: number;
  online: boolean;
  pending: boolean;
  probeTimer?: ReturnType<typeof setTimeout>;
  releaseTimer?: ReturnType<typeof setTimeout>;
  target?: VuuAuthTarget;
  wasOnline: boolean;
}

/** A connection that was lost and is being reconnected by the registry. */
interface LostConnection {
  /** True while a user-requested reconnect attempt is in flight. */
  checking?: boolean;
  lostAt: number;
  /** Set once the grace period has passed; the server is shown offline. */
  offline: boolean;
  timer?: ReturnType<typeof setTimeout>;
}

export interface VuuServerMonitorProps {
  authHandler: AuthHandler;
  moduleServerMap: ModuleServerMap;
  now?: () => number;
  options?: ServerMonitorOptions;
  random?: () => number;
  registry: VuuConnectionRegistry;
  /** Resolves a module's connection to the target to acquire. */
  resolveTarget: (connection: RemoteModuleConnection) => VuuAuthTarget;
  scheduler?: Scheduler;
}

const isAuthorizationDenied = (error: unknown) =>
  error instanceof VuuTokenExchangeError &&
  error.failure === "authorization-denied";

/**
 * Keeps connections open to the Vuu servers of the applications in the
 * portal navigation, so that their presence (and, later, notifications) is
 * known before they are opened. Connections are acquired from the shared
 * `VuuConnectionRegistry`, so an opened application reuses them.
 */
export class VuuServerMonitor extends ServerStatusStore {
  readonly #authHandler: AuthHandler;
  readonly #options: Required<ServerMonitorOptions>;
  readonly #random: () => number;
  readonly #lost = new Map<string, LostConnection>();
  readonly #records = new Map<string, ServerRecord>();
  readonly #registry: VuuConnectionRegistry;
  readonly #resolveTarget: VuuServerMonitorProps["resolveTarget"];
  readonly #scheduler: Scheduler;
  #displayOrder?: ModuleId[];
  #openModule?: ModuleId;
  #queue: string[] = [];
  #queueTimer?: ReturnType<typeof setTimeout>;
  #running = false;
  #selected = new Set<string>();
  #unsubscribeRegistry?: () => void;
  #visibleModules = new Set<ModuleId>();

  constructor({
    authHandler,
    moduleServerMap,
    now = Date.now,
    options,
    random = Math.random,
    registry,
    resolveTarget,
    scheduler = defaultScheduler,
  }: VuuServerMonitorProps) {
    super(moduleServerMap, now);
    this.#authHandler = authHandler;
    this.#options = { ...DEFAULT_SERVER_MONITOR_OPTIONS, ...options };
    this.#random = random;
    this.#registry = registry;
    this.#resolveTarget = resolveTarget;
    this.#scheduler = scheduler;
  }

  /** Servers currently selected for monitoring, highest priority first. */
  get selectedIds() {
    return [...this.#selected];
  }

  start() {
    if (this.#running) {
      return;
    }
    this.#running = true;
    this.#unsubscribeRegistry = this.#registry.onStateChange((id, state) =>
      this.#handleStateChange(id, state),
    );
    super.start();
    this.#evaluate();
  }

  stop() {
    if (!this.#running) {
      return;
    }
    this.#running = false;
    super.stop();
    this.#unsubscribeRegistry?.();
    this.#unsubscribeRegistry = undefined;
    if (this.#queueTimer) {
      this.#scheduler.clearTimeout(this.#queueTimer);
      this.#queueTimer = undefined;
    }
    this.#queue = [];
    for (const connectionId of [...this.#lost.keys()]) {
      this.#clearLost(connectionId);
    }
    for (const record of this.#records.values()) {
      this.#clearTimers(record);
      if (record.held) {
        this.#registry.release(record.connectionId);
      }
    }
    this.#records.clear();
    this.#selected = new Set();
  }

  setDisplayOrder(moduleIds: ModuleId[]) {
    this.#displayOrder = moduleIds;
    this.#evaluate();
  }

  setOpenModule(moduleId: ModuleId | undefined) {
    if (this.#openModule !== moduleId) {
      this.#openModule = moduleId;
      this.#evaluate();
    }
  }

  setVisibleModules(moduleIds: Iterable<ModuleId>) {
    const next = new Set(moduleIds);
    if (
      next.size !== this.#visibleModules.size ||
      [...next].some((id) => !this.#visibleModules.has(id))
    ) {
      this.#visibleModules = next;
      this.#evaluate();
    }
  }

  /** Connects to a server now, without waiting for the next probe. */
  retry(connectionId: string) {
    if (!this.#running) {
      return;
    }
    const lost = this.#lost.get(connectionId);
    if (lost) {
      this.#reconnectNow(connectionId, lost);
      return;
    }
    if (connectionId === this.map.portalConnectionId) {
      return;
    }
    const record =
      this.#records.get(connectionId) ?? this.#createRecord(connectionId);
    if (
      !record?.target ||
      record.pending ||
      record.held ||
      record.failure?.presence === "unauthorized"
    ) {
      return;
    }
    this.#clearProbe(record);
    this.#acquire(record);
    // A server outside the selection is released after the usual delay.
    this.#evaluate();
  }

  retryModule(moduleId: ModuleId) {
    const resolution = this.map.get(moduleId);
    if (resolution.status === "error") {
      this.map.retry(moduleId);
    } else if (resolution.status === "resolved") {
      this.retry(resolution.connectionId);
    }
  }

  protected onMapChange() {
    this.#evaluate();
  }

  protected trackedIds() {
    return this.#records.keys();
  }

  protected computeStatus(
    connectionId: string,
    previous?: VuuServerStatus,
  ): VuuServerStatus {
    const isPortal = connectionId === this.map.portalConnectionId;
    const record = this.#records.get(connectionId);
    const state = this.#registry.getState(connectionId);
    const monitored = isPortal || this.#selected.has(connectionId);
    const presence = this.#presence(connectionId, isPortal, state, record);
    const failed = presence === "offline" || presence === "unauthorized";
    const lost =
      state === "reconnecting" ? this.#lost.get(connectionId) : undefined;
    if (lost && failed) {
      return nextStatus(
        previous,
        {
          connectionId,
          monitored,
          presence,
          detail: {
            checking: lost.checking || undefined,
            endpoint: endpointHost(record?.target?.websocketUrl),
            lastOnlineAt: record?.lastOnlineAt ?? lost.lostAt,
            reason: REASON.connectionLost,
            reconnecting: true,
          },
        },
        this.now(),
      );
    }
    return nextStatus(
      previous,
      {
        connectionId,
        monitored,
        presence,
        detail: failed
          ? {
              checking: record?.pending || undefined,
              endpoint: endpointHost(record?.target?.websocketUrl),
              error: record?.failure?.error?.message,
              lastAttemptAt: record?.lastAttemptAt,
              lastOnlineAt: record?.lastOnlineAt,
              nextAttemptAt:
                presence === "unauthorized" ? undefined : record?.nextAttemptAt,
              reason:
                presence === "unauthorized"
                  ? REASON.unauthorized
                  : record?.wasOnline
                    ? REASON.connectionLost
                    : REASON.notResponding,
            }
          : undefined,
      },
      this.now(),
    );
  }

  #presence(
    connectionId: string,
    isPortal: boolean,
    state: VuuServerConnectionState | undefined,
    record?: ServerRecord,
  ): VuuServerPresence {
    switch (state) {
      case "connected":
        return "online";
      case "reconnecting":
        return this.#lost.get(connectionId)?.offline ? "offline" : "degraded";
      case "failed":
        return "offline";
      case "unauthorized":
        return "unauthorized";
      case "authenticating":
      case "connecting":
        // A probe of a failed server stays offline until it succeeds.
        return record?.failure?.presence ?? "connecting";
      default:
        // The portal connection is held by the identity provider.
        return record?.failure?.presence ?? (isPortal ? "online" : "unknown");
    }
  }

  #createRecord(connectionId: string) {
    const target = this.#targetFor(connectionId);
    if (!target) {
      return undefined;
    }
    const record: ServerRecord = {
      connectionId,
      held: false,
      online: this.#registry.getState(connectionId) === "connected",
      pending: false,
      target,
      wasOnline: false,
    };
    this.#records.set(connectionId, record);
    return record;
  }

  #targetFor(connectionId: string) {
    for (const moduleId of this.map.modulesFor(connectionId)) {
      const resolution = this.map.get(moduleId);
      if (resolution.status === "resolved" && resolution.connection) {
        try {
          return this.#resolveTarget(resolution.connection);
        } catch {
          return undefined;
        }
      }
    }
    return undefined;
  }

  /** Candidate servers in priority order, excluding the portal server. */
  #candidates() {
    const navigable = this.map.modules
      .filter((module) => !isNestedModule(module))
      .map(({ id }) => id);
    const order = this.#displayOrder ?? navigable;
    const serverOf = (moduleId: ModuleId) => {
      const resolution = this.map.get(moduleId);
      return resolution.status === "resolved" &&
        resolution.connectionId !== this.map.portalConnectionId
        ? resolution.connectionId
        : undefined;
    };
    const ordered: string[] = [];
    const add = (moduleId: ModuleId | undefined) => {
      const id = moduleId === undefined ? undefined : serverOf(moduleId);
      if (id !== undefined && !ordered.includes(id)) {
        ordered.push(id);
      }
    };
    add(this.#openModule);
    order.filter((id) => this.#visibleModules.has(id)).forEach(add);
    order.forEach(add);
    return ordered;
  }

  #evaluate() {
    if (!this.#running) {
      return;
    }
    const max = this.#options.enabled ? this.#options.maxMonitoredServers : 0;
    const selected = new Set<string>();
    for (const id of this.#candidates()) {
      if (selected.size >= max) {
        break;
      }
      if (this.#records.get(id) ?? this.#createRecord(id)) {
        selected.add(id);
      }
    }
    this.#selected = selected;

    for (const id of selected) {
      const record = this.#records.get(id) as ServerRecord;
      this.#cancelRelease(record);
      if (record.held || record.pending) {
        continue;
      }
      if (record.failure) {
        if (record.failure.presence === "offline" && !record.probeTimer) {
          this.#scheduleProbe(record);
        }
      } else {
        this.#enqueue(id);
      }
    }
    for (const record of this.#records.values()) {
      if (!selected.has(record.connectionId)) {
        this.#scheduleRelease(record);
      }
    }
    this.refresh();
  }

  #enqueue(connectionId: string) {
    if (!this.#queue.includes(connectionId)) {
      this.#queue.push(connectionId);
    }
    if (!this.#queueTimer) {
      this.#pump();
    }
  }

  #pump() {
    this.#queueTimer = undefined;
    let record: ServerRecord | undefined;
    while (!record && this.#queue.length > 0) {
      const id = this.#queue.shift() as string;
      const candidate = this.#records.get(id);
      if (
        candidate &&
        this.#selected.has(id) &&
        !candidate.held &&
        !candidate.pending &&
        !candidate.failure
      ) {
        record = candidate;
      }
    }
    if (record) {
      this.#acquire(record);
    }
    // After an acquire, keep the gate closed for staggerMs even if the
    // queue is empty, so servers enqueued shortly afterwards are spaced too.
    if (record || this.#queue.length > 0) {
      this.#queueTimer = this.#scheduler.setTimeout(
        () => this.#pump(),
        this.#options.staggerMs,
      );
    }
  }

  #acquire(record: ServerRecord) {
    const { target } = record;
    if (!target) {
      return;
    }
    record.pending = true;
    record.lastAttemptAt = this.now();
    record.nextAttemptAt = undefined;
    const isCurrent = () =>
      this.#running && this.#records.get(record.connectionId) === record;
    this.#registry.acquire(this.#authHandler, target).then(
      () => {
        if (!isCurrent()) {
          this.#registry.release(target.connectionId);
          return;
        }
        record.pending = false;
        record.held = true;
        record.failure = undefined;
        record.online = true;
        record.wasOnline = true;
        this.#evaluate();
      },
      (error: unknown) => {
        // The registry entry holds a reference even when acquire fails.
        this.#registry.release(target.connectionId);
        if (!isCurrent()) {
          return;
        }
        record.pending = false;
        this.#fail(record, error);
      },
    );
    this.refresh();
  }

  #fail(record: ServerRecord, error: unknown) {
    const unauthorized = isAuthorizationDenied(error);
    record.failure = {
      error: error instanceof Error ? error : undefined,
      presence: unauthorized ? "unauthorized" : "offline",
    };
    if (!unauthorized && this.#selected.has(record.connectionId)) {
      this.#scheduleProbe(record);
    }
    this.refresh();
  }

  #handleStateChange(connectionId: string, state: VuuServerConnectionState) {
    if (state === "reconnecting") {
      this.#markLost(connectionId);
    } else {
      this.#clearLost(connectionId);
    }
    const record = this.#records.get(connectionId);
    if (record) {
      if (state === "connected") {
        record.online = true;
        record.wasOnline = true;
        record.failure = undefined;
        this.#clearProbe(record);
      } else if (record.online) {
        record.online = false;
        record.lastOnlineAt = this.now();
      }
      if (record.held && (state === "failed" || state === "unauthorized")) {
        // The registry gave up; release and probe at a slower pace.
        record.held = false;
        this.#registry.release(connectionId);
        this.#fail(
          record,
          state === "unauthorized"
            ? new VuuTokenExchangeError(
                `VUU authorization denied for ${connectionId}`,
                403,
              )
            : new Error(`VUU connection ${connectionId} failed`),
        );
        return;
      }
      if (record.held && state === "idle") {
        // Disconnected by someone else, e.g. logout.
        record.held = false;
        this.#evaluate();
        return;
      }
    }
    this.refresh();
  }

  /**
   * Shows a lost connection as degraded while the registry reconnects, and
   * as offline if it has not reconnected within `offlineAfterMs`. Brief drops
   * don't flicker the navigation, longer ones are visible without waiting
   * for the registry to give up.
   */
  #markLost(connectionId: string) {
    if (this.#lost.has(connectionId)) {
      return;
    }
    const lost: LostConnection = { lostAt: this.now(), offline: false };
    lost.timer = this.#scheduler.setTimeout(() => {
      lost.timer = undefined;
      if (this.#lost.get(connectionId) === lost) {
        lost.offline = true;
        this.refresh();
      }
    }, this.#options.offlineAfterMs);
    this.#lost.set(connectionId, lost);
  }

  /** Skips the registry's wait before its next reconnect attempt. */
  #reconnectNow(connectionId: string, lost: LostConnection) {
    if (lost.checking) {
      return;
    }
    const attempt = this.#registry.reconnectNow(connectionId);
    if (!attempt) {
      return;
    }
    lost.checking = true;
    this.refresh();
    attempt.finally(() => {
      lost.checking = false;
      if (this.#lost.get(connectionId) === lost) {
        this.refresh();
      }
    });
  }

  #clearLost(connectionId: string) {
    const lost = this.#lost.get(connectionId);
    if (lost) {
      if (lost.timer) {
        this.#scheduler.clearTimeout(lost.timer);
      }
      this.#lost.delete(connectionId);
    }
  }

  #scheduleProbe(record: ServerRecord) {
    this.#clearProbe(record);
    const jitter = 0.9 + this.#random() * 0.2;
    const delay = Math.round(this.#options.probeIntervalMs * jitter);
    record.nextAttemptAt = this.now() + delay;
    record.probeTimer = this.#scheduler.setTimeout(() => {
      record.probeTimer = undefined;
      if (
        this.#running &&
        this.#selected.has(record.connectionId) &&
        !record.pending &&
        !record.held
      ) {
        this.#acquire(record);
      }
    }, delay);
  }

  #clearProbe(record: ServerRecord) {
    if (record.probeTimer) {
      this.#scheduler.clearTimeout(record.probeTimer);
      record.probeTimer = undefined;
    }
    record.nextAttemptAt = undefined;
  }

  #scheduleRelease(record: ServerRecord) {
    if (record.releaseTimer) {
      return;
    }
    record.releaseTimer = this.#scheduler.setTimeout(() => {
      record.releaseTimer = undefined;
      if (!this.#running || this.#selected.has(record.connectionId)) {
        return;
      }
      if (record.pending) {
        // Try again once the attempt settles.
        this.#scheduleRelease(record);
        return;
      }
      this.#clearProbe(record);
      if (record.held) {
        this.#registry.release(record.connectionId);
      }
      this.#records.delete(record.connectionId);
      this.refresh();
    }, this.#options.releaseDelayMs);
  }

  #cancelRelease(record: ServerRecord) {
    if (record.releaseTimer) {
      this.#scheduler.clearTimeout(record.releaseTimer);
      record.releaseTimer = undefined;
    }
  }

  #clearTimers(record: ServerRecord) {
    this.#cancelRelease(record);
    this.#clearProbe(record);
  }
}

export interface LocalServerMonitorProps {
  localServerIds: Iterable<string>;
  moduleServerMap: ModuleServerMap;
  now?: () => number;
}

/**
 * Status source for local mode, where servers are simulated in the
 * browser: every local server is online unless a presence is set for it,
 * e.g. by a showcase example.
 */
export class LocalServerMonitor extends ServerStatusStore {
  readonly #localServerIds: Set<string>;
  readonly #presence = new Map<string, VuuServerPresence>();

  constructor({
    localServerIds,
    moduleServerMap,
    now = Date.now,
  }: LocalServerMonitorProps) {
    super(moduleServerMap, now);
    this.#localServerIds = new Set(localServerIds);
  }

  /** Overrides a local server's presence, for demos and tests. */
  setPresence(connectionId: string, presence: VuuServerPresence | undefined) {
    if (presence === undefined) {
      this.#presence.delete(connectionId);
    } else {
      this.#presence.set(connectionId, presence);
    }
    this.refresh();
  }

  retryModule(moduleId: ModuleId) {
    if (this.map.get(moduleId).status === "error") {
      this.map.retry(moduleId);
    }
  }

  protected trackedIds() {
    return this.#localServerIds;
  }

  protected computeStatus(
    connectionId: string,
    previous?: VuuServerStatus,
  ): VuuServerStatus {
    const local =
      this.#localServerIds.has(connectionId) ||
      connectionId === this.map.portalConnectionId;
    const presence =
      this.#presence.get(connectionId) ?? (local ? "online" : "unknown");
    return nextStatus(
      previous,
      {
        connectionId,
        detail:
          presence === "offline"
            ? { reason: REASON.notResponding }
            : presence === "unauthorized"
              ? { reason: REASON.unauthorized }
              : undefined,
        monitored: local,
        presence,
      },
      this.now(),
    );
  }
}
