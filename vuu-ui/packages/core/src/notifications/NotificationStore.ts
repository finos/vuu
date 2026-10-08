import type { ModuleId } from "../connection-management/ModuleServerMap";
import type {
  NotificationCountFilter,
  NotificationQuery,
  NotificationStoreEvent,
  PortalNotification,
} from "./notification-types";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export interface NotificationStoreOptions {
  /** Notifications kept in memory. Default 500. */
  maxNotifications?: number;
  /** How long expired notifications are kept. Default 24 hours. */
  expiredRetentionMs?: number;
  /** How long read and deleted keys are remembered. Default 7 days. */
  stateRetentionMs?: number;
  /** Most read, and most deleted, keys remembered. Default 2000 each. */
  maxStateKeys?: number;
  now?: () => number;
}

/**
 * The persisted read state: keys read and keys deleted, each with the time
 * it happened. The notifications themselves are not persisted; the servers
 * are the source of truth for current rows.
 */
export type NotificationReadState = {
  version: 1;
  read: Record<string, number>;
  deleted: Record<string, number>;
};

export const isNotificationReadState = (
  value: unknown,
): value is NotificationReadState =>
  typeof value === "object" &&
  value !== null &&
  (value as NotificationReadState).version === 1 &&
  typeof (value as NotificationReadState).read === "object" &&
  typeof (value as NotificationReadState).deleted === "object";

type Listener = (event: NotificationStoreEvent) => void;

const sameIds = (a: readonly ModuleId[], b: readonly ModuleId[]) =>
  a.length === b.length && a.every((id, i) => id === b[i]);

const sameContent = (a: PortalNotification, b: PortalNotification) =>
  a.title === b.title &&
  a.message === b.message &&
  a.level === b.level &&
  a.kind === b.kind &&
  a.createdAt === b.createdAt &&
  a.expiresAt === b.expiresAt &&
  a.expired === b.expired &&
  a.read === b.read &&
  sameIds(a.origin.moduleIds, b.origin.moduleIds) &&
  JSON.stringify(a.attributes) === JSON.stringify(b.attributes);

const newestFirst = (a: PortalNotification, b: PortalNotification) =>
  b.createdAt - a.createdAt || b.receivedAt - a.receivedAt;

const trimOldest = (map: Map<string, number>, before: number, max: number) => {
  for (const [key, time] of map) {
    if (time < before) {
      map.delete(key);
    }
  }
  if (map.size > max) {
    const oldest = [...map].sort((a, b) => a[1] - b[1]);
    for (const [key] of oldest.slice(0, map.size - max)) {
      map.delete(key);
    }
  }
};

const matchesText = (notification: PortalNotification, text: string) => {
  const pattern = text.toLowerCase();
  return (
    notification.title.toLowerCase().includes(pattern) ||
    notification.message.toLowerCase().includes(pattern) ||
    Object.values(notification.attributes).some((value) =>
      String(value).toLowerCase().includes(pattern),
    )
  );
};

/**
 * Consolidated notification history and read state, from every server and
 * from client code. Unread counts per module and per server are maintained
 * incrementally so that badges are cheap to render.
 */
export class NotificationStore {
  readonly #expiredAt = new Map<string, number>();
  readonly #expiredRetentionMs: number;
  readonly #listeners = new Set<Listener>();
  readonly #maxNotifications: number;
  readonly #maxStateKeys: number;
  readonly #notifications = new Map<string, PortalNotification>();
  readonly #now: () => number;
  readonly #readKeys = new Map<string, number>();
  readonly #stateRetentionMs: number;
  readonly #tombstones = new Map<string, number>();
  readonly #unreadByConnection = new Map<string, number>();
  readonly #unreadByModule = new Map<ModuleId, number>();
  #openModuleId: ModuleId | undefined;
  #sorted: PortalNotification[] | undefined;
  #unreadPortal = 0;
  #unreadTotal = 0;
  #version = 0;

  constructor({
    expiredRetentionMs = DAY,
    maxNotifications = 500,
    maxStateKeys = 2000,
    now = Date.now,
    stateRetentionMs = 7 * DAY,
  }: NotificationStoreOptions = {}) {
    this.#expiredRetentionMs = expiredRetentionMs;
    this.#maxNotifications = maxNotifications;
    this.#maxStateKeys = maxStateKeys;
    this.#now = now;
    this.#stateRetentionMs = stateRetentionMs;
  }

  get size() {
    return this.#notifications.size;
  }

  get openModuleId() {
    return this.#openModuleId;
  }

  get(key: string) {
    return this.#notifications.get(key);
  }

  /**
   * Adds a notification, or updates one with the same key while keeping its
   * read state. Deleted keys are ignored. A new notification is read if its
   * key was read before or it is attributed to the open module.
   */
  upsert(notification: PortalNotification) {
    const { key } = notification;
    if (this.#tombstones.has(key)) {
      return;
    }
    const existing = this.#notifications.get(key);
    if (existing) {
      const next: PortalNotification = {
        ...notification,
        initial: existing.initial,
        read: existing.read || this.#isOpen(notification),
        receivedAt: existing.receivedAt,
      };
      if (next.read && !existing.read) {
        this.#readKeys.set(key, this.#now());
      }
      if (!next.expired) {
        this.#expiredAt.delete(key);
      }
      if (!sameContent(existing, next)) {
        this.#replace(existing, next);
        this.#emit({ type: "updated", notification: next });
      }
      return;
    }
    const read =
      notification.read ||
      this.#readKeys.has(key) ||
      this.#isOpen(notification);
    const next = { ...notification, read };
    if (read && !this.#readKeys.has(key)) {
      this.#readKeys.set(key, this.#now());
    }
    this.#notifications.set(key, next);
    this.#count(next, 1);
    this.#sorted = undefined;
    this.#emit({ type: "added", notification: next });
    this.#evict();
  }

  /** Marks a notification expired: the server deleted its row. */
  expire(key: string) {
    const existing = this.#notifications.get(key);
    if (existing && !existing.expired) {
      this.#expiredAt.set(key, this.#now());
      const next = { ...existing, expired: true };
      this.#replace(existing, next);
      this.#emit({ type: "updated", notification: next });
    }
  }

  markRead(keys: readonly string[] | "all", read = true) {
    const changed: string[] = [];
    const candidates =
      keys === "all"
        ? [...this.#notifications.values()]
        : keys.flatMap((key) => this.#notifications.get(key) ?? []);
    const now = this.#now();
    for (const notification of candidates) {
      if (notification.read !== read) {
        this.#replace(notification, { ...notification, read });
        changed.push(notification.key);
      }
      if (read) {
        this.#readKeys.set(notification.key, now);
      } else {
        this.#readKeys.delete(notification.key);
      }
    }
    if (changed.length > 0) {
      this.#emit({
        type: "read-state",
        keys: keys === "all" ? "all" : changed,
      });
    }
  }

  /**
   * Removes notifications. Server notifications are remembered as deleted
   * so they are not added again when the feed resubscribes.
   */
  delete(keys: readonly string[] | "all") {
    const targets =
      keys === "all"
        ? [...this.#notifications.values()]
        : keys.flatMap((key) => this.#notifications.get(key) ?? []);
    const now = this.#now();
    for (const notification of targets) {
      if (notification.origin.source === "server") {
        this.#tombstones.set(notification.key, now);
      }
    }
    this.#remove(targets);
  }

  /**
   * Sets the module the user has open. Its notifications are marked read,
   * and so are new ones attributed to it while it stays open. Banners are
   * not: they stay unread until the user closes them.
   */
  setOpenModule(moduleId: ModuleId | undefined) {
    this.#openModuleId = moduleId;
    if (moduleId !== undefined) {
      this.markRead(
        [...this.#notifications.values()]
          .filter(
            (notification) => !notification.read && this.#isOpen(notification),
          )
          .map(({ key }) => key),
      );
    }
  }

  /**
   * Recomputes the modules server notifications are attributed to, e.g.
   * when the module→server map changes. `attribute` returns `undefined` to
   * leave a notification unchanged.
   */
  reattribute(
    attribute: (notification: PortalNotification) => ModuleId[] | undefined,
  ) {
    for (const notification of [...this.#notifications.values()]) {
      const moduleIds = attribute(notification);
      if (moduleIds && !sameIds(moduleIds, notification.origin.moduleIds)) {
        const next: PortalNotification = {
          ...notification,
          origin: { ...notification.origin, moduleIds },
        };
        if (!next.read && this.#isOpen(next)) {
          next.read = true;
          this.#readKeys.set(next.key, this.#now());
        }
        this.#replace(notification, next);
        this.#emit({ type: "updated", notification: next });
      }
    }
  }

  /** Newest first. */
  query(q: NotificationQuery = {}): readonly PortalNotification[] {
    const sorted = this.#getSorted();
    const {
      connectionIds,
      includeExpired = true,
      kinds,
      levels,
      moduleIds,
      read,
      since,
      text,
    } = q;
    if (
      !connectionIds &&
      includeExpired &&
      !kinds &&
      !levels &&
      !moduleIds &&
      read === undefined &&
      since === undefined &&
      !text
    ) {
      return sorted;
    }
    return sorted.filter(
      (n) =>
        (includeExpired || !n.expired) &&
        (read === undefined || n.read === read) &&
        (since === undefined || n.createdAt >= since) &&
        (!levels || levels.includes(n.level)) &&
        (!kinds || kinds.includes(n.kind)) &&
        (!connectionIds ||
          (n.origin.connectionId !== undefined &&
            connectionIds.includes(n.origin.connectionId))) &&
        (!moduleIds ||
          n.origin.moduleIds.some((id) => moduleIds.includes(id))) &&
        (!text || matchesText(n, text)),
    );
  }

  latest(): PortalNotification | undefined {
    return this.#getSorted()[0];
  }

  /**
   * Unread notifications, optionally for some modules or servers. With
   * several modules, a notification attributed to more than one of them is
   * counted for each.
   */
  unreadCount({ connectionIds, moduleIds }: NotificationCountFilter = {}) {
    if (moduleIds && connectionIds) {
      return this.query({ connectionIds, moduleIds, read: false }).length;
    }
    if (moduleIds) {
      return moduleIds.reduce<number>(
        (sum, id) => sum + (this.#unreadByModule.get(id) ?? 0),
        0,
      );
    }
    if (connectionIds) {
      return connectionIds.reduce(
        (sum, id) => sum + (this.#unreadByConnection.get(id) ?? 0),
        0,
      );
    }
    return this.#unreadTotal;
  }

  /** Unread notifications attributed to no module. */
  get unreadPortalCount() {
    return this.#unreadPortal;
  }

  subscribe = (listener: Listener) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  /** Changes on every change, for `useSyncExternalStore`. */
  getSnapshot = () => this.#version;

  /** Drops expired notifications, and read and deleted keys, past retention. */
  prune() {
    const now = this.#now();
    const stale: PortalNotification[] = [];
    for (const [key, expiredAt] of this.#expiredAt) {
      const notification = this.#notifications.get(key);
      if (notification && now - expiredAt > this.#expiredRetentionMs) {
        stale.push(notification);
      }
    }
    this.#remove(stale);
    const before = now - this.#stateRetentionMs;
    trimOldest(this.#readKeys, before, this.#maxStateKeys);
    trimOldest(this.#tombstones, before, this.#maxStateKeys);
  }

  getReadState(): NotificationReadState {
    this.prune();
    return {
      deleted: Object.fromEntries(this.#tombstones),
      read: Object.fromEntries(this.#readKeys),
      version: 1,
    };
  }

  /** Merges persisted read state, applying it to current notifications. */
  loadReadState(state: NotificationReadState) {
    for (const [key, time] of Object.entries(state.read)) {
      if (typeof time === "number") {
        this.#readKeys.set(key, Math.max(time, this.#readKeys.get(key) ?? 0));
      }
    }
    for (const [key, time] of Object.entries(state.deleted)) {
      if (typeof time === "number") {
        this.#tombstones.set(key, time);
      }
    }
    this.prune();
    const deleted = [...this.#notifications.values()].filter(({ key }) =>
      this.#tombstones.has(key),
    );
    this.#remove(deleted);
    this.markRead(
      [...this.#notifications.values()]
        .filter(({ key, read }) => !read && this.#readKeys.has(key))
        .map(({ key }) => key),
    );
  }

  /** Forgets everything, e.g. at logout. */
  clear() {
    const keys = [...this.#notifications.keys()];
    this.#notifications.clear();
    this.#expiredAt.clear();
    this.#readKeys.clear();
    this.#tombstones.clear();
    this.#unreadByConnection.clear();
    this.#unreadByModule.clear();
    this.#unreadPortal = 0;
    this.#unreadTotal = 0;
    this.#openModuleId = undefined;
    this.#sorted = undefined;
    if (keys.length > 0) {
      this.#emit({ type: "removed", keys });
    }
  }

  /** Banners are portal-wide, so stay unread until closed. */
  #isOpen({ kind, origin }: PortalNotification) {
    return (
      kind !== "banner" &&
      this.#openModuleId !== undefined &&
      origin.moduleIds.includes(this.#openModuleId)
    );
  }

  #getSorted() {
    if (!this.#sorted) {
      this.#sorted = [...this.#notifications.values()].sort(newestFirst);
    }
    return this.#sorted;
  }

  #replace(previous: PortalNotification, next: PortalNotification) {
    this.#count(previous, -1);
    this.#notifications.set(next.key, next);
    this.#count(next, 1);
    // Keep the sorted list in step without re-sorting, unless order changed.
    if (this.#sorted) {
      if (previous.createdAt === next.createdAt) {
        const index = this.#sorted.indexOf(previous);
        if (index !== -1) {
          this.#sorted = this.#sorted.slice();
          this.#sorted[index] = next;
        } else {
          this.#sorted = undefined;
        }
      } else {
        this.#sorted = undefined;
      }
    }
  }

  #remove(notifications: PortalNotification[]) {
    if (notifications.length === 0) {
      return;
    }
    for (const notification of notifications) {
      this.#count(notification, -1);
      this.#notifications.delete(notification.key);
      this.#expiredAt.delete(notification.key);
    }
    this.#sorted = undefined;
    this.#emit({ type: "removed", keys: notifications.map(({ key }) => key) });
  }

  /** Evicts the oldest read notifications, then the oldest, over the cap. */
  #evict() {
    const excess = this.#notifications.size - this.#maxNotifications;
    if (excess <= 0) {
      return;
    }
    const oldestFirst = [...this.#getSorted()].reverse();
    const victims = [
      ...oldestFirst.filter(({ read }) => read),
      ...oldestFirst.filter(({ read }) => !read),
    ].slice(0, excess);
    this.#remove(victims);
  }

  #count(notification: PortalNotification, delta: 1 | -1) {
    if (notification.read) {
      return;
    }
    this.#unreadTotal += delta;
    const { connectionId, moduleIds } = notification.origin;
    if (moduleIds.length === 0) {
      this.#unreadPortal += delta;
    }
    for (const moduleId of moduleIds) {
      this.#unreadByModule.set(
        moduleId,
        (this.#unreadByModule.get(moduleId) ?? 0) + delta,
      );
    }
    if (connectionId !== undefined) {
      this.#unreadByConnection.set(
        connectionId,
        (this.#unreadByConnection.get(connectionId) ?? 0) + delta,
      );
    }
  }

  #emit(event: NotificationStoreEvent) {
    this.#version += 1;
    for (const listener of this.#listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error("[NotificationStore] listener failed", error);
      }
    }
  }
}
