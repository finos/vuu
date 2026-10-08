import {
  AuthenticationProvider,
  type RemoteModuleConnection,
} from "@vuu-ui/core";
import {
  loadRemote,
  registerRemotes,
} from "@module-federation/enhanced/runtime";
import { NotificationOriginProvider } from "@vuu-ui/vuu-notifications";
import React, {
  Suspense,
  lazy,
  use,
  useContext,
  useEffect,
  useMemo,
} from "react";
import {
  ApplicationStateProvider,
  useOptionalPortalPersistence,
} from "../persistence/PersistenceContext";
import type { StateMigration } from "../persistence/StateMigrations";
import { useStoreReady } from "../persistence/useStoreReady";
import { PortalModuleIdContext } from "../notifications/PortalNotificationsContext";
import { useRegisterNotificationHost } from "../notifications/PortalNotificationsProvider";
import { useOptionalSavedState } from "../saved-state/SavedStateContext";
import { useInRouterContext, useLocation } from "react-router-dom";
import { RemoteModuleErrorBoundary } from "./RemoteModuleErrorBoundary";
import {
  forgetRemoteModuleConfig,
  loadRemoteModuleConfig,
} from "./remote-module-config";

export interface RemoteModuleProps {
  ViewProps?: {
    allowRename?: boolean;
    closeable?: boolean;
    header?: boolean;
  };
  /** With `version`, identifies the module's saved state, unless `persistenceKey` is set. */
  clientIdentifier?: string;
  css?: string;
  height?: number;
  mfComponent: string;
  mfScope: string;
  mfUrl: string;
  onError?: (error: Error) => void;
  /** Overrides `clientIdentifier` as the key for the module's saved state. */
  persistenceKey?: string;
  title?: string;
  /** The module's version; saved state is kept per version. */
  version?: number;
  /**
   * The Vuu server the module connects to. Normally omitted: the connection
   * is read from the `config.json` the remote publishes at `mfUrl`. Set it to
   * point a generic module, such as a table viewer, at a specific server.
   */
  vuu?: RemoteModuleConnection;
  width?: number;
}

type RemoteExports = {
  default: React.ComponentType<Record<string, unknown>>;
  stateMigrations?: readonly StateMigration[];
};

const getRemoteComponentKey = (
  mfUrl: string,
  mfScope: string,
  mfComponent: string,
) => `${mfUrl}|${mfScope}/${mfComponent}`;

const remoteExports = new Map<string, Promise<RemoteExports>>();
const components = new Map<string, ReturnType<typeof lazy>>();

/**
 * Loads the exposed module once, so that the component and its
 * `stateMigrations` export share one request.
 */
const loadRemoteExports = (
  mfUrl: string,
  mfScope: string,
  mfComponent: string,
) => {
  const key = getRemoteComponentKey(mfUrl, mfScope, mfComponent);
  let exports = remoteExports.get(key);
  if (exports === undefined) {
    registerRemotes([
      {
        name: mfScope,
        entry: `${mfUrl}/mf-manifest.json`,
      },
    ]);
    exports = loadRemote<RemoteExports>(`${mfScope}/${mfComponent}`, {
      from: "runtime",
    }).then((remote) => {
      if (remote === null || remote === undefined) {
        throw Error(
          `Unable to load remote component ${mfScope}/${mfComponent}`,
        );
      }
      return remote;
    });
    exports.catch(() => {
      if (remoteExports.get(key) === exports) {
        remoteExports.delete(key);
      }
    });
    remoteExports.set(key, exports);
  }
  return exports;
};

const getRemoteComponent = (
  mfUrl: string,
  mfScope: string,
  mfComponent: string,
) => {
  const componentKey = getRemoteComponentKey(mfUrl, mfScope, mfComponent);
  let component = components.get(componentKey);

  if (component === undefined) {
    // Start loading now, alongside the module's config.json, rather than
    // when the component first renders. Capturing the request means a
    // failure is reported, not silently retried, on the next render.
    const exports = loadRemoteExports(mfUrl, mfScope, mfComponent);
    component = lazy(() => exports);
    components.set(componentKey, component);
  }

  return component;
};

const forgetRemote = (mfUrl: string, mfScope: string, mfComponent: string) => {
  const key = getRemoteComponentKey(mfUrl, mfScope, mfComponent);
  components.delete(key);
  remoteExports.delete(key);
  forgetRemoteModuleConfig(mfUrl);
};

const toStateMigrations = (exports: RemoteExports) =>
  Array.isArray(exports.stateMigrations) ? exports.stateMigrations : [];

/**
 * Resolves the module's ApplicationStateStore (FR-2). The document is loaded
 * in parallel with the remote code; migrations wait for the code (§6.2).
 */
const useRemoteModuleState = ({
  clientIdentifier,
  mfComponent,
  mfScope,
  mfUrl,
  persistenceKey,
  title,
  version,
}: Pick<
  RemoteModuleProps,
  | "clientIdentifier"
  | "mfComponent"
  | "mfScope"
  | "mfUrl"
  | "persistenceKey"
  | "title"
  | "version"
>) => {
  const service = useOptionalPortalPersistence();
  const applicationKey = persistenceKey ?? clientIdentifier;
  const hasKey =
    applicationKey !== undefined &&
    applicationKey !== "" &&
    Number.isInteger(version);

  const store = useMemo(() => {
    if (!service || !hasKey || service.isDisposed()) return undefined;
    return service.getStore(applicationKey as string, version as number, {
      title,
      migrations: loadRemoteExports(mfUrl, mfScope, mfComponent).then(
        toStateMigrations,
      ),
    });
  }, [
    applicationKey,
    hasKey,
    mfComponent,
    mfScope,
    mfUrl,
    service,
    title,
    version,
  ]);

  useEffect(() => {
    if (service && store) {
      return service.markOpen(store.applicationKey, store.applicationVersion);
    }
  }, [service, store]);

  // Once the module renders, say what wasn't carried forward (§5.4.7).
  const reportCarryForward = useOptionalSavedState()?.reportCarryForward;
  useEffect(() => {
    if (service && store && reportCarryForward && store.status !== "loading") {
      const report = service.consumeCarryForwardReport(
        store.applicationKey,
        store.applicationVersion,
      );
      if (report) reportCarryForward(report);
    }
  }, [reportCarryForward, service, store]);

  useStoreReady(store);
  return store;
};

function RemoteModuleContent(props: RemoteModuleProps) {
  const {
    css: _css,
    mfComponent,
    mfScope,
    mfUrl,
    persistenceKey: _persistenceKey,
    vuu,
    ...remoteProps
  } = props;
  const store = useRemoteModuleState(props);
  useRegisterNotificationHost(vuu?.connectionId);
  const moduleId = useContext(PortalModuleIdContext);
  const RemoteComponent = getRemoteComponent(mfUrl, mfScope, mfComponent);
  const connection = vuu ?? use(loadRemoteModuleConfig(mfUrl)).vuu;
  const remoteComponent = <RemoteComponent {...remoteProps} />;

  // Always provide a value, so the portal's own store is never visible to
  // the module (FR-3).
  return (
    <ApplicationStateProvider store={store}>
      <NotificationOriginProvider
        connectionId={connection?.connectionId}
        moduleId={moduleId}
      >
        {connection ? (
          <AuthenticationProvider mode="vuu-connection" connection={connection}>
            {remoteComponent}
          </AuthenticationProvider>
        ) : (
          remoteComponent
        )}
      </NotificationOriginProvider>
    </ApplicationStateProvider>
  );
}

function RawRemoteModule(props: RemoteModuleProps) {
  const { mfComponent, mfScope, mfUrl, onError } = props;

  return (
    <RemoteModuleErrorBoundary
      mfComponent={mfComponent}
      mfScope={mfScope}
      mfUrl={mfUrl}
      onError={(error) => {
        forgetRemote(mfUrl, mfScope, mfComponent);
        onError?.(error);
      }}
    >
      {/* Suspend here, not at the root, so the shell (and its persistence
          service) commits while the code and saved state load. */}
      <Suspense fallback={null}>
        <RemoteModuleContent {...props} />
      </Suspense>
    </RemoteModuleErrorBoundary>
  );
}

type RoutedRemoteModuleProps = RemoteModuleProps;

const RoutedRemoteModule = (props: RoutedRemoteModuleProps) => {
  const location = useLocation();
  return <RawRemoteModule key={location.key} {...props} />;
};

export const RemoteModule = React.memo((props: RoutedRemoteModuleProps) =>
  useInRouterContext() ? (
    <RoutedRemoteModule {...props} />
  ) : (
    <RawRemoteModule {...props} />
  ),
);
RemoteModule.displayName = "RemoteModule";
