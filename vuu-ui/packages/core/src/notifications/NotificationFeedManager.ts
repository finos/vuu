import type { DataSourceConstructorProps } from "@vuu-ui/vuu-data-types";
import { ConnectionManager, VuuDataSource } from "@vuu-ui/vuu-data-remote";
import type {
  ModuleId,
  ModuleServerMap,
} from "../connection-management/ModuleServerMap";
import type {
  VuuConnectionRegistry,
  VuuServerConnectionState,
} from "../connection-management/VuuConnectionRegistry";
import type { RemoteModuleDescriptor } from "../RemoteModuleDescriptor";
import type { NotificationStore } from "./NotificationStore";
import {
  serverNotificationKey,
  toPortalNotification,
  type ServerNotificationRow,
} from "./notification-row-mapping";
import type {
  NotificationAttribution,
  PortalNotification,
} from "./notification-types";
import {
  type NotificationFeedScope,
  ServerNotificationFeed,
  type ServerNotificationFeedProps,
} from "./ServerNotificationFeed";

const MODULE_ATTRIBUTES = ["module", "clientIdentifier"];

/**
 * Attributes a notification to the modules whose `clientIdentifier` is
 * named by its `module` or `clientIdentifier` column, if any.
 */
const matchModules = (
  { attributes }: PortalNotification,
  modules: RemoteModuleDescriptor[],
) => {
  const names = MODULE_ATTRIBUTES.map((name) => attributes[name]).filter(
    (value): value is string => typeof value === "string" && value !== "",
  );
  return names.length === 0
    ? []
    : modules
        .filter(({ clientIdentifier }) => names.includes(clientIdentifier))
        .map(({ id }) => id);
};

/**
 * One module: that module. Several: those the notification names, else all
 * of them. The portal's own server: only those the notification names, so
 * that portal notifications don't badge every app on that server.
 */
export const defaultNotificationAttribution =
  (portalConnectionId: string): NotificationAttribution =>
  (notification, modules) => {
    if (notification.origin.connectionId === portalConnectionId) {
      return matchModules(notification, modules);
    }
    if (modules.length <= 1) {
      return modules.map(({ id }) => id);
    }
    const matched = matchModules(notification, modules);
    return matched.length > 0 ? matched : modules.map(({ id }) => id);
  };

/** Data scope for a remote server, as `ConnectionDataScope` provides. */
export const remoteNotificationScope = (
  connectionId: string,
): NotificationFeedScope => ({
  getServerAPI: () => ConnectionManager.serverAPIFor(connectionId),
  VuuDataSource: class NotificationVuuDataSource extends VuuDataSource {
    constructor(props: DataSourceConstructorProps) {
      super({ ...props, connectionId });
    }
  },
});

export interface NotificationFeedManagerProps {
  attribution?: NotificationAttribution;
  createFeed?: (props: ServerNotificationFeedProps) => ServerNotificationFeed;
  /** Host modules by connection; pass one to keep them across managers. */
  hosts?: Map<string, ModuleId>;
  maxPerServer?: number;
  moduleServerMap: ModuleServerMap;
  now?: () => number;
  store: NotificationStore;
}

/**
 * Runs one `ServerNotificationFeed` per connected server, converts rows to
 * notifications and attributes them to modules, using the module→server
 * map. Servers used by no module (e.g. a module's `vuu` override) are
 * attributed to the module that hosts the connection, else the portal.
 */
export class NotificationFeedManager {
  readonly #attribution: NotificationAttribution;
  readonly #createFeed: NonNullable<NotificationFeedManagerProps["createFeed"]>;
  readonly #feeds = new Map<string, ServerNotificationFeed>();
  readonly #hosts: Map<string, ModuleId>;
  /** Notification key by row key, per connection. */
  readonly #keys = new Map<string, Map<string, string>>();
  readonly #maxPerServer: number;
  readonly #map: ModuleServerMap;
  readonly #now: () => number;
  readonly #store: NotificationStore;
  readonly #unsubscribeMap: () => void;

  constructor({
    attribution,
    createFeed = (props) => new ServerNotificationFeed(props),
    hosts = new Map(),
    maxPerServer = 200,
    moduleServerMap,
    now = Date.now,
    store,
  }: NotificationFeedManagerProps) {
    this.#attribution =
      attribution ??
      defaultNotificationAttribution(moduleServerMap.portalConnectionId);
    this.#createFeed = createFeed;
    this.#hosts = hosts;
    this.#maxPerServer = maxPerServer;
    this.#map = moduleServerMap;
    this.#now = now;
    this.#store = store;
    this.#unsubscribeMap = moduleServerMap.subscribe(this.#reattribute);
  }

  get connectionIds() {
    return [...this.#feeds.keys()];
  }

  /** Starts the feed for a server. Does nothing if one is running. */
  attach(connectionId: string, scope: NotificationFeedScope) {
    if (this.#feeds.has(connectionId)) {
      return;
    }
    const feed = this.#createFeed({
      connectionId,
      maxRows: this.#maxPerServer,
      now: this.#now,
      scope,
      sink: {
        expire: this.#expire,
        upsert: this.#upsert,
      },
    });
    this.#feeds.set(connectionId, feed);
    void feed.start();
  }

  /**
   * Stops the feed for a server. Its notifications stay in the store;
   * when the feed is attached again they are updated in place.
   */
  detach(connectionId: string) {
    this.#feeds.get(connectionId)?.dispose();
    this.#feeds.delete(connectionId);
    this.#keys.delete(connectionId);
  }

  /**
   * Records the module that hosts a connection no module maps to, e.g. a
   * `RemoteModule` with a `vuu` override. The first host is kept.
   */
  registerHost(connectionId: string, moduleId: ModuleId) {
    if (!this.#hosts.has(connectionId)) {
      this.#hosts.set(connectionId, moduleId);
      this.#reattribute();
    }
  }

  /**
   * Attaches feeds to remote servers as the registry connects them, and
   * detaches them when a connection is released or fails. A reconnecting
   * feed is kept; the data source resubscribes.
   */
  driveFromRegistry(
    registry: Pick<VuuConnectionRegistry, "connectedIds" | "onStateChange">,
    isRemote: (connectionId: string) => boolean = () => true,
    scopeFor: (
      connectionId: string,
    ) => NotificationFeedScope = remoteNotificationScope,
  ) {
    const onState = (connectionId: string, state: VuuServerConnectionState) => {
      if (!isRemote(connectionId)) return;
      if (state === "connected") {
        this.attach(connectionId, scopeFor(connectionId));
      } else if (
        state === "idle" ||
        state === "failed" ||
        state === "unauthorized"
      ) {
        this.detach(connectionId);
      }
    };
    const unsubscribe = registry.onStateChange(onState);
    for (const connectionId of registry.connectedIds()) {
      onState(connectionId, "connected");
    }
    return unsubscribe;
  }

  dispose() {
    this.#unsubscribeMap();
    for (const connectionId of [...this.#feeds.keys()]) {
      this.detach(connectionId);
    }
  }

  #modulesFor(notification: PortalNotification): ModuleId[] {
    const { connectionId } = notification.origin;
    if (connectionId === undefined) {
      return notification.origin.moduleIds;
    }
    const ids = new Set(this.#map.modulesFor(connectionId));
    const modules = this.#map.modules.filter(({ id }) => ids.has(id));
    if (modules.length === 0 && connectionId !== this.#map.portalConnectionId) {
      const host = this.#hosts.get(connectionId);
      return host === undefined ? [] : [host];
    }
    return this.#attribution(notification, modules);
  }

  #upsert = (row: ServerNotificationRow, initial: boolean) => {
    const notification = toPortalNotification(row, {
      initial,
      receivedAt: this.#now(),
    });
    let keys = this.#keys.get(row.connectionId);
    if (!keys) {
      keys = new Map();
      this.#keys.set(row.connectionId, keys);
    }
    keys.set(row.rowKey, notification.key);
    notification.origin.moduleIds = this.#modulesFor(notification);
    this.#store.upsert(notification);
  };

  #expire = (connectionId: string, rowKey: string) => {
    const keys = this.#keys.get(connectionId);
    const key =
      keys?.get(rowKey) ?? serverNotificationKey(connectionId, rowKey);
    keys?.delete(rowKey);
    this.#store.expire(key);
  };

  #reattribute = () => {
    this.#store.reattribute((notification) =>
      notification.origin.source === "server"
        ? this.#modulesFor(notification)
        : undefined,
    );
  };
}
