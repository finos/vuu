import {
  createContext,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { matchPath, useLocation } from "react-router-dom";
import {
  normalizeVuuAuthTarget,
  useOptionalIdentityContext,
} from "../auth/AuthenticationProvider";
import type { ModuleId } from "../connection-management/ModuleServerMap";
import type {
  ServerMonitorOptions,
  VuuServerStatus,
  VuuServerStatusSource,
} from "../connection-management/server-status";
import {
  LocalServerMonitor,
  VuuServerMonitor,
} from "../connection-management/VuuServerMonitor";
import type { RemoteModuleDescriptor } from "../RemoteModuleDescriptor";
import { NavVisibilityTracker } from "./NavVisibilityTracker";

interface ServerMonitorContextValue {
  monitor: VuuServerStatusSource;
  visibility: NavVisibilityTracker;
}

const ServerMonitorContext = createContext<ServerMonitorContextValue | null>(
  null,
);

export interface VuuServerMonitorProviderProps {
  children?: ReactNode;
  /** A status source to use instead of creating one, e.g. for demos. */
  monitor?: VuuServerStatusSource;
  /** `false` disables acquiring connections; config failures still show. */
  options?: ServerMonitorOptions | false;
}

/**
 * Creates the server monitor for the portal. Renders its children without
 * a monitor outside an `AuthenticationProvider`.
 */
export const VuuServerMonitorProvider = ({
  children,
  monitor: monitorProp,
  options,
}: VuuServerMonitorProviderProps) => {
  const identity = useOptionalIdentityContext();
  const optionsKey = JSON.stringify(options ?? {});

  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on identity fields and optionsKey
  const value = useMemo<ServerMonitorContextValue | null>(() => {
    if (monitorProp) {
      return {
        monitor: monitorProp,
        visibility: new NavVisibilityTracker((visible) =>
          monitorProp.setVisibleModules(visible),
        ),
      };
    }
    if (!identity) {
      return null;
    }
    const {
      authHandler,
      localServers,
      moduleServerMap,
      portalTarget,
      registry,
    } = identity;
    const monitorOptions: ServerMonitorOptions =
      options === false ? { enabled: false } : (options ?? {});
    const monitor: VuuServerStatusSource = localServers
      ? new LocalServerMonitor({
          localServerIds: localServers.keys(),
          moduleServerMap,
        })
      : new VuuServerMonitor({
          authHandler,
          moduleServerMap,
          options: monitorOptions,
          registry,
          resolveTarget: (connection) =>
            normalizeVuuAuthTarget(connection, portalTarget),
        });
    const visibility = new NavVisibilityTracker((visible) =>
      monitor.setVisibleModules(visible),
    );
    return { monitor, visibility };
  }, [
    identity?.authHandler,
    identity?.localServers,
    identity?.moduleServerMap,
    identity?.portalTarget,
    identity?.registry,
    monitorProp,
    optionsKey,
  ]);

  const addLogoutListener = identity?.addLogoutListener;
  useEffect(() => {
    if (!value) {
      return;
    }
    const { monitor, visibility } = value;
    monitor.start();
    // Release monitored connections before logout closes them.
    const removeLogoutListener = addLogoutListener?.(() => monitor.stop());
    return () => {
      removeLogoutListener?.();
      monitor.stop();
      visibility.disconnect();
    };
  }, [addLogoutListener, value]);

  return (
    <ServerMonitorContext.Provider value={value}>
      {children}
    </ServerMonitorContext.Provider>
  );
};

/** The portal's server monitor, if there is one. */
export const useServerMonitor = () => useContext(ServerMonitorContext)?.monitor;

const noSubscription = () => () => undefined;
const EMPTY_STATUSES: ReadonlyMap<string, VuuServerStatus> = new Map();
const unknownStatuses = new Map<string, VuuServerStatus>();
const unknownStatus = (connectionId: string) => {
  let status = unknownStatuses.get(connectionId);
  if (!status) {
    status = { connectionId, monitored: false, presence: "unknown", since: 0 };
    unknownStatuses.set(connectionId, status);
  }
  return status;
};

export const useVuuServerStatus = (connectionId: string): VuuServerStatus => {
  const monitor = useServerMonitor();
  return useSyncExternalStore(
    monitor?.subscribe ?? noSubscription,
    () => monitor?.getStatus(connectionId) ?? unknownStatus(connectionId),
  );
};

export const useVuuServerStatuses = (): ReadonlyMap<
  string,
  VuuServerStatus
> => {
  const monitor = useServerMonitor();
  return useSyncExternalStore(
    monitor?.subscribe ?? noSubscription,
    () => monitor?.getStatuses() ?? EMPTY_STATUSES,
  );
};

/**
 * The status of a module's server, or `unavailable` if the module's config
 * could not be loaded.
 */
export const useModuleServerStatus = (moduleId: ModuleId): VuuServerStatus => {
  const monitor = useServerMonitor();
  return useSyncExternalStore(
    monitor?.subscribe ?? noSubscription,
    () => monitor?.getModuleStatus(moduleId) ?? unknownStatus(""),
  );
};

const EMPTY_STATUS_LIST: VuuServerStatus[] = [];

/** The statuses of several modules, e.g. a nav group's children. */
export const useModuleServerStatusList = (
  moduleIds: ModuleId[],
): VuuServerStatus[] => {
  const monitor = useServerMonitor();
  const previous = useRef<VuuServerStatus[]>(EMPTY_STATUS_LIST);
  const getSnapshot = useCallback(() => {
    if (!monitor || moduleIds.length === 0) {
      return EMPTY_STATUS_LIST;
    }
    const statuses = moduleIds.map((id) => monitor.getModuleStatus(id));
    // A stable array while every status is unchanged.
    if (
      statuses.length === previous.current.length &&
      statuses.every((status, i) => status === previous.current[i])
    ) {
      return previous.current;
    }
    previous.current = statuses;
    return statuses;
  }, [monitor, moduleIds]);
  return useSyncExternalStore(
    monitor?.subscribe ?? noSubscription,
    getSnapshot,
  );
};

/** Reconnects to a server now. */
export const useRetryConnection = () => {
  const monitor = useServerMonitor();
  return useCallback(
    (connectionId: string) => monitor?.retry(connectionId),
    [monitor],
  );
};

/** Retries a module's server connection, or reloads its config. */
export const useRetryModule = () => {
  const monitor = useServerMonitor();
  return useCallback(
    (moduleId: ModuleId) => monitor?.retryModule(moduleId),
    [monitor],
  );
};

/** Reports whether a nav item is visible, to prioritise its server. */
export const useNavItemVisibility = (
  moduleId: ModuleId | undefined,
  ref: RefObject<Element | null>,
) => {
  const visibility = useContext(ServerMonitorContext)?.visibility;
  useEffect(() => {
    const element = ref.current;
    if (visibility && element && moduleId !== undefined) {
      return visibility.observe(element, moduleId);
    }
  }, [moduleId, ref, visibility]);
};

/** The module whose route is open, if any. */
export const useOpenModuleId = (
  remoteModules: Pick<RemoteModuleDescriptor, "id" | "path">[],
) => {
  const { pathname } = useLocation();
  return useMemo(
    () =>
      remoteModules.find(({ path }) =>
        matchPath({ end: false, path: path.replace(/\/?\*$/, "") }, pathname),
      )?.id,
    [pathname, remoteModules],
  );
};

/** Reports the open module, the monitor's highest priority. */
export const useTrackOpenModule = (
  remoteModules: Pick<RemoteModuleDescriptor, "id" | "path">[],
) => {
  const monitor = useServerMonitor();
  const openModuleId = useOpenModuleId(remoteModules);
  useEffect(() => {
    monitor?.setOpenModule(openModuleId);
  }, [monitor, openModuleId]);
};
