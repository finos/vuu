import {
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useOptionalIdentityContext } from "../auth/AuthenticationProvider";
import type { ModuleId } from "../connection-management/ModuleServerMap";
import { useData } from "../context-definitions/DataProvider";
import { useOptionalApplicationState } from "../persistence/PersistenceContext";
import type { LocalVuuServer } from "../VuuServerDescriptor";
import { NotificationFeedManager } from "./NotificationFeedManager";
import {
  isNotificationReadState,
  NotificationStore,
} from "./NotificationStore";
import {
  type PortalNotificationsAPI,
  PortalModuleIdContext,
  PortalNotificationsContext,
  type PortalNotificationsContextValue,
  type PublishedNotification,
} from "./PortalNotificationsContext";
import type {
  NotificationCountFilter,
  NotificationQuery,
  PortalNotification,
  PortalNotificationsOptions,
} from "./notification-types";

/** Entry in the portal's own saved state that holds read state. */
export const NOTIFICATIONS_STATE_KEY = "notifications";
const SAVE_DELAY_MS = 500;
const PRUNE_INTERVAL_MS = 60_000;

export interface PortalNotificationsProviderProps {
  children?: ReactNode;
  /** The module whose route is open; its notifications are marked read. */
  openModuleId?: ModuleId;
  options?: PortalNotificationsOptions | false;
}

const LocalNotificationFeed = ({
  connectionId,
  manager,
}: {
  connectionId: string;
  manager: NotificationFeedManager;
}) => {
  const { getServerAPI, VuuDataSource } = useData();
  useEffect(() => {
    manager.attach(connectionId, { getServerAPI, VuuDataSource });
    return () => manager.detach(connectionId);
  }, [connectionId, getServerAPI, manager, VuuDataSource]);
  return null;
};

/** Feeds for in-browser servers, which are only reachable through React. */
const LocalNotificationFeeds = ({
  localServers,
  manager,
}: {
  localServers: ReadonlyMap<string, LocalVuuServer>;
  manager: NotificationFeedManager;
}) =>
  [...localServers.values()].map(({ connectionId, DataSourceProvider }) => (
    <DataSourceProvider key={connectionId}>
      <LocalNotificationFeed connectionId={connectionId} manager={manager} />
    </DataSourceProvider>
  ));

/** Loads and saves read state in the portal's own saved state. */
const useReadStatePersistence = (store: NotificationStore) => {
  const portalState = useOptionalApplicationState();
  useEffect(() => {
    if (!portalState) {
      return;
    }
    const saved = portalState.get(NOTIFICATIONS_STATE_KEY);
    if (isNotificationReadState(saved)) {
      store.loadReadState(saved);
    }
    let lastSaved = JSON.stringify(store.getReadState());
    let timer: ReturnType<typeof setTimeout> | undefined;
    const save = () => {
      timer = undefined;
      const state = store.getReadState();
      const json = JSON.stringify(state);
      if (json !== lastSaved) {
        lastSaved = json;
        portalState.set(NOTIFICATIONS_STATE_KEY, state, {
          label: "Notification read state",
        });
      }
    };
    const unsubscribe = store.subscribe(() => {
      timer ??= setTimeout(save, SAVE_DELAY_MS);
    });
    return () => {
      unsubscribe();
      if (timer !== undefined) {
        clearTimeout(timer);
        save();
      }
    };
  }, [portalState, store]);
};

/**
 * Collects notifications from every server the portal's modules use, and
 * from client code, into one store that the navigation badges and the
 * notifications viewer read. Renders its children without notifications
 * outside an `AuthenticationProvider`, or when disabled.
 */
export const PortalNotificationsProvider = ({
  children,
  openModuleId,
  options,
}: PortalNotificationsProviderProps) => {
  const identity = useOptionalIdentityContext();
  const enabled = options !== false && options?.enabled !== false;
  const { attribution, maxNotifications, maxPerServer } = options || {};
  const userName = identity?.user.userName;

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new store per user
  const store = useMemo(
    () => new NotificationStore({ maxNotifications }),
    [maxNotifications, userName],
  );
  const hosts = useMemo(() => new Map<string, ModuleId>(), []);
  const [manager, setManager] = useState<NotificationFeedManager>();
  const managerRef = useRef<NotificationFeedManager>(undefined);

  const moduleServerMap = identity?.moduleServerMap;
  const registry = identity?.registry;
  const localServers = identity?.localServers;
  useEffect(() => {
    if (!enabled || !moduleServerMap || !registry) {
      return;
    }
    const next = new NotificationFeedManager({
      attribution,
      hosts,
      maxPerServer,
      moduleServerMap,
      store,
    });
    managerRef.current = next;
    setManager(next);
    const stopDriving = localServers
      ? undefined
      : next.driveFromRegistry(registry);
    return () => {
      stopDriving?.();
      next.dispose();
      managerRef.current = undefined;
      setManager(undefined);
    };
  }, [
    attribution,
    enabled,
    hosts,
    localServers,
    maxPerServer,
    moduleServerMap,
    registry,
    store,
  ]);

  useReadStatePersistence(store);

  useEffect(() => {
    store.setOpenModule(enabled ? openModuleId : undefined);
  }, [enabled, openModuleId, store]);

  useEffect(() => {
    const timer = setInterval(() => store.prune(), PRUNE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [store]);

  const addLogoutListener = identity?.addLogoutListener;
  useEffect(
    () =>
      addLogoutListener?.(() => {
        managerRef.current?.dispose();
      }),
    [addLogoutListener],
  );

  const registerHost = useCallback(
    (connectionId: string, moduleId: ModuleId) => {
      if (managerRef.current) {
        managerRef.current.registerHost(connectionId, moduleId);
      } else if (!hosts.has(connectionId)) {
        hosts.set(connectionId, moduleId);
      }
    },
    [hosts],
  );

  const value = useMemo<PortalNotificationsContextValue | null>(
    () => (enabled && identity ? { registerHost, store } : null),
    [enabled, identity, registerHost, store],
  );

  return (
    <PortalNotificationsContext.Provider value={value}>
      {manager && localServers ? (
        <LocalNotificationFeeds localServers={localServers} manager={manager} />
      ) : null}
      {children}
    </PortalNotificationsContext.Provider>
  );
};

const noSubscription = () => () => undefined;
const zero = () => 0;
const EMPTY_LIST: readonly PortalNotification[] = [];

const useStoreVersion = (store: NotificationStore | undefined) =>
  useSyncExternalStore(
    store?.subscribe ?? noSubscription,
    store?.getSnapshot ?? zero,
  );

/**
 * The portal's notifications, or `undefined` when there is no portal or
 * notifications are disabled.
 */
export const usePortalNotifications = ():
  PortalNotificationsAPI | undefined => {
  const context = useContext(PortalNotificationsContext);
  const moduleId = useContext(PortalModuleIdContext);
  return useMemo(() => {
    if (!context) {
      return undefined;
    }
    const { store } = context;
    return {
      delete: (keys) => store.delete(keys),
      markRead: (keys, read) => store.markRead(keys, read),
      publish: ({
        attributes = {},
        id,
        kind = "toast",
        level = "info",
        message = "",
        title,
      }: PublishedNotification) => {
        const now = Date.now();
        const key = `client:${moduleId ?? "portal"}:${id}`;
        const notification: PortalNotification = {
          attributes,
          createdAt: store.get(key)?.createdAt ?? now,
          expired: false,
          id,
          initial: false,
          key,
          kind,
          level,
          message,
          origin: {
            moduleIds: moduleId === undefined ? [] : [moduleId],
            source: "client",
          },
          read: false,
          receivedAt: now,
          title,
        };
        store.upsert(notification);
        return store.get(key) ?? notification;
      },
      store,
    };
  }, [context, moduleId]);
};

/** Notifications matching `query`, newest first. */
export const useNotificationList = (
  query?: NotificationQuery,
): readonly PortalNotification[] => {
  const store = useContext(PortalNotificationsContext)?.store;
  const version = useStoreVersion(store);
  const queryKey = JSON.stringify(query ?? {});
  // biome-ignore lint/correctness/useExhaustiveDependencies: version and queryKey track the store and query
  return useMemo(
    () => store?.query(query) ?? EMPTY_LIST,
    [store, version, queryKey],
  );
};

/** Unread notifications, optionally for some modules or servers. */
export const useUnreadCount = (filter?: NotificationCountFilter) => {
  const store = useContext(PortalNotificationsContext)?.store;
  return useSyncExternalStore(store?.subscribe ?? noSubscription, () =>
    store ? store.unreadCount(filter) : 0,
  );
};

/** Unread notifications attributed to a module. */
export const useModuleUnreadCount = (moduleId: ModuleId | undefined) => {
  const store = useContext(PortalNotificationsContext)?.store;
  return useSyncExternalStore(store?.subscribe ?? noSubscription, () =>
    store && moduleId !== undefined
      ? store.unreadCount({ moduleIds: [moduleId] })
      : 0,
  );
};

export const useLatestNotification = (): PortalNotification | undefined => {
  const store = useContext(PortalNotificationsContext)?.store;
  return useSyncExternalStore(store?.subscribe ?? noSubscription, () =>
    store?.latest(),
  );
};

/**
 * Attributes notifications from `connectionId` to the module rendering this
 * component, when no registered module uses that server. Used by
 * `RemoteModule` for its `vuu` override.
 */
export const useRegisterNotificationHost = (
  connectionId: string | undefined,
) => {
  const registerHost = useContext(PortalNotificationsContext)?.registerHost;
  const moduleId = useContext(PortalModuleIdContext);
  useEffect(() => {
    if (registerHost && connectionId && moduleId !== undefined) {
      registerHost(connectionId, moduleId);
    }
  }, [connectionId, moduleId, registerHost]);
};
