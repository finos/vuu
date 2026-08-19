import { ConnectionManager, VuuDataSource } from "@vuu-ui/vuu-data-remote";
import type {
  DataSourceConstructorProps,
  RemoteModuleConnection,
} from "@vuu-ui/vuu-data-types";
import { DataProvider } from "../context-definitions/DataProvider";
import type { PortalModuleRegistry } from "../RemoteModuleDescriptor";
import type {
  LocalVuuServer,
  VuuServerDescriptor,
} from "../VuuServerDescriptor";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthConfig } from "./AuthConfig";
import type {
  AuthenticatedIdentity,
  AuthHandler,
  AuthHandlerClass,
  User,
} from "./AuthHandler";
import {
  vuuConnectionRegistry,
  type VuuConnectionRegistry,
} from "../connection-management/VuuConnectionRegistry";
import { VuuTokenExchangeError } from "./VuuTokenExchange";
import type {
  VuuAuthTarget,
  VuuSession,
  VuuTokenExchangeFailure,
} from "./VuuTokenExchange";

export class AuthenticationConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationConfigurationError";
  }
}

export class VuuConnectionError extends Error {
  readonly failure?: VuuTokenExchangeFailure;
  readonly status?: number;

  constructor(
    readonly connectionId: string,
    cause: unknown,
  ) {
    const detail = cause instanceof Error ? `: ${cause.message}` : "";
    super(`VUU connection authentication failed for ${connectionId}${detail}`, {
      cause,
    });
    this.name = "VuuConnectionError";
    if (cause instanceof VuuTokenExchangeError) {
      this.failure = cause.failure;
      this.status = cause.status;
    }
  }
}

export type AuthenticationErrorHandler = (error: Error) => void;

export interface IdentityAuthenticationProps {
  authConfig: AuthConfig;
  authHandlerClass: AuthHandlerClass;
  children: ReactNode;
  connectionId?: string;
  mode: "identity";
  onError?: AuthenticationErrorHandler;
  registry?: VuuConnectionRegistry;
}

export interface VuuConnectionAuthenticationProps {
  children: ReactNode;
  connection: RemoteModuleConnection;
  mode: "vuu-connection";
  onError?: AuthenticationErrorHandler;
}

export interface LocalAuthenticationProps {
  authorizations?: string[];
  children: ReactNode;
  /**
   * Vuu servers simulated in the browser. A module (or a nested
   * `mode="vuu-connection"` provider) whose `vuu.connectionId` matches one of
   * these receives that server's data context instead of a websocket.
   */
  localServers?: LocalVuuServer[];
  mode: "local";
  registry?: PortalModuleRegistry;
  user?: User;
}

export type AuthenticationProviderProps =
  | IdentityAuthenticationProps
  | LocalAuthenticationProps
  | VuuConnectionAuthenticationProps;

interface IdentityContextValue {
  authHandler: AuthHandler;
  getIdentityToken: () => Promise<string>;
  /** Present only in local mode, keyed by connectionId. */
  localServers?: ReadonlyMap<string, LocalVuuServer>;
  logout: () => Promise<void>;
  moduleRegistry?: PortalModuleRegistry;
  portalTarget: VuuAuthTarget;
  registry: VuuConnectionRegistry;
  user: User;
}

interface VuuConnectionContextValue {
  connectionId: string;
  session: VuuSession;
}

const IdentityContext = createContext<IdentityContextValue | null>(null);
const VuuConnectionContext = createContext<VuuConnectionContextValue | null>(
  null,
);
const EMPTY_AUTHORIZATIONS: string[] = [];
const EMPTY_LOCAL_SERVERS: LocalVuuServer[] = [];
const EMPTY_MODULE_REGISTRY: PortalModuleRegistry = { modules: [] };

export const normalizeVuuAuthTarget = (
  connection: RemoteModuleConnection,
  portalTarget: VuuAuthTarget,
): VuuAuthTarget => {
  const isPortalConnection =
    connection.connectionId === portalTarget.connectionId;
  const restUrl =
    connection.restUrl ??
    (isPortalConnection ? portalTarget.restUrl : undefined);
  const websocketUrl =
    connection.websocketUrl ??
    (isPortalConnection ? portalTarget.websocketUrl : undefined);

  if (!restUrl || !websocketUrl) {
    throw new AuthenticationConfigurationError(
      `Connection ${connection.connectionId} must define restUrl and websocketUrl`,
    );
  }

  return {
    connectionId: connection.connectionId,
    restUrl,
    websocketUrl,
  };
};

const useConnectionSession = (
  authHandler: AuthHandler,
  target: VuuAuthTarget,
  onError: AuthenticationErrorHandler | undefined,
  registry: VuuConnectionRegistry = vuuConnectionRegistry,
) => {
  const [session, setSession] = useState<VuuSession>();
  const [error, setError] = useState<Error>();

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};

    registry
      .acquire(authHandler, target)
      .then((nextSession) => {
        if (active) {
          setSession(nextSession);
          unsubscribe = registry.subscribe(
            target.connectionId,
            setSession,
            (cause) => {
              const nextError = new VuuConnectionError(
                target.connectionId,
                cause,
              );
              setError(nextError);
              onError?.(nextError);
            },
          );
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          const nextError = new VuuConnectionError(target.connectionId, cause);
          setError(nextError);
          onError?.(nextError);
        }
      });

    return () => {
      active = false;
      unsubscribe();
      registry.release(target.connectionId);
    };
  }, [authHandler, onError, registry, target]);

  if (error) {
    throw error;
  }
  return session;
};

const ConnectionDataScope = ({
  children,
  connectionId,
}: {
  children: ReactNode;
  connectionId: string;
}) => {
  const BoundVuuDataSource = useMemo(
    () =>
      class ConnectionScopedVuuDataSource extends VuuDataSource {
        constructor(props: DataSourceConstructorProps) {
          super({ ...props, connectionId });
        }
      },
    [connectionId],
  );
  const getServerAPI = useMemo(
    () => () => ConnectionManager.serverAPIFor(connectionId),
    [connectionId],
  );

  return (
    <DataProvider
      VuuDataSource={BoundVuuDataSource}
      getServerAPI={getServerAPI}
      isLocalData={false}
    >
      {children}
    </DataProvider>
  );
};

const IdentityAuthenticationProvider = ({
  authConfig,
  authHandlerClass,
  children,
  connectionId = "portal",
  onError,
  registry = vuuConnectionRegistry,
}: IdentityAuthenticationProps) => {
  const authHandler = useMemo(
    () => new authHandlerClass(authConfig),
    [authConfig, authHandlerClass],
  );
  const [identity, setIdentity] = useState<AuthenticatedIdentity>();
  const [identityError, setIdentityError] = useState<Error>();
  const portalTarget = useMemo<VuuAuthTarget>(
    () => ({
      connectionId,
      restUrl: authConfig.restUrl,
      websocketUrl: authConfig.websocketUrl,
    }),
    [authConfig.restUrl, authConfig.websocketUrl, connectionId],
  );

  useEffect(() => {
    let active = true;
    authHandler.authenticate().then(
      (authenticatedIdentity) => {
        if (active) {
          setIdentity(authenticatedIdentity);
        }
      },
      (cause: unknown) => {
        if (active) {
          const error =
            cause instanceof Error
              ? cause
              : new Error("Identity authentication failed", { cause });
          setIdentityError(error);
          onError?.(error);
        }
      },
    );
    return () => {
      active = false;
    };
  }, [authHandler, onError]);

  if (identityError) {
    throw identityError;
  }
  if (!identity) {
    return null;
  }

  return (
    <AuthenticatedIdentityProvider
      authHandler={authHandler}
      identity={identity}
      portalTarget={portalTarget}
      onError={onError}
      registry={registry}
    >
      {children}
    </AuthenticatedIdentityProvider>
  );
};

const AuthenticatedIdentityProvider = ({
  authHandler,
  children,
  identity,
  onError,
  portalTarget,
  registry,
}: {
  authHandler: AuthHandler;
  children: ReactNode;
  identity: AuthenticatedIdentity;
  onError?: AuthenticationErrorHandler;
  portalTarget: VuuAuthTarget;
  registry: VuuConnectionRegistry;
}) => {
  const session = useConnectionSession(
    authHandler,
    portalTarget,
    onError,
    registry,
  );
  const getIdentityToken = useCallback(
    () => authHandler.getIdentityToken(),
    [authHandler],
  );
  const logout = useCallback(async () => {
    await registry.disconnectAll();
    await authHandler.logout();
  }, [authHandler, registry]);
  const identityContext = useMemo<IdentityContextValue>(
    () => ({
      authHandler,
      getIdentityToken,
      logout,
      moduleRegistry: session?.moduleRegistry,
      portalTarget,
      registry,
      user: identity.user,
    }),
    [
      authHandler,
      getIdentityToken,
      identity.user,
      logout,
      portalTarget,
      registry,
      session?.moduleRegistry,
    ],
  );

  if (!session) {
    return null;
  }

  return (
    <IdentityContext.Provider value={identityContext}>
      <VuuConnectionContext.Provider
        value={{ connectionId: portalTarget.connectionId, session }}
      >
        {children}
      </VuuConnectionContext.Provider>
    </IdentityContext.Provider>
  );
};

const RemoteVuuConnectionProvider = ({
  children,
  connection,
  identity,
  onError,
}: Omit<VuuConnectionAuthenticationProps, "mode"> & {
  identity: IdentityContextValue;
}) => {
  const target = useMemo(
    () => normalizeVuuAuthTarget(connection, identity.portalTarget),
    [connection, identity.portalTarget],
  );
  const session = useConnectionSession(
    identity.authHandler,
    target,
    onError,
    identity.registry,
  );

  if (!session) {
    return null;
  }

  return (
    <VuuConnectionContext.Provider
      value={{ connectionId: target.connectionId, session }}
    >
      <ConnectionDataScope connectionId={target.connectionId}>
        {children}
      </ConnectionDataScope>
    </VuuConnectionContext.Provider>
  );
};

const LocalVuuConnectionProvider = ({
  children,
  connection,
  localServers,
}: {
  children: ReactNode;
  connection: RemoteModuleConnection;
  localServers: ReadonlyMap<string, LocalVuuServer>;
}) => {
  const parentConnection = useContext(VuuConnectionContext);
  const localServer = localServers.get(connection.connectionId);
  if (!localServer) {
    throw new AuthenticationConfigurationError(
      `No local Vuu server is registered for connection ${connection.connectionId}`,
    );
  }
  if (!parentConnection) {
    throw new AuthenticationConfigurationError(
      "No authenticated VUU connection has been installed",
    );
  }
  const { DataSourceProvider } = localServer;
  return (
    <VuuConnectionContext.Provider
      value={{
        connectionId: localServer.connectionId,
        session: parentConnection.session,
      }}
    >
      <DataSourceProvider>{children}</DataSourceProvider>
    </VuuConnectionContext.Provider>
  );
};

const VuuConnectionAuthenticationProvider = ({
  children,
  connection,
  onError,
}: VuuConnectionAuthenticationProps) => {
  const identity = useContext(IdentityContext);
  if (!identity) {
    throw new AuthenticationConfigurationError(
      'AuthenticationProvider mode="vuu-connection" requires an identity provider',
    );
  }
  return identity.localServers ? (
    <LocalVuuConnectionProvider
      connection={connection}
      localServers={identity.localServers}
    >
      {children}
    </LocalVuuConnectionProvider>
  ) : (
    <RemoteVuuConnectionProvider
      connection={connection}
      identity={identity}
      onError={onError}
    >
      {children}
    </RemoteVuuConnectionProvider>
  );
};

const LocalAuthenticationProvider = ({
  authorizations = EMPTY_AUTHORIZATIONS,
  children,
  localServers = EMPTY_LOCAL_SERVERS,
  registry = EMPTY_MODULE_REGISTRY,
  user = { userName: "local-user" },
}: LocalAuthenticationProps) => {
  const localServerMap = useMemo(
    () => new Map(localServers.map((server) => [server.connectionId, server])),
    [localServers],
  );
  const session = useMemo<VuuSession>(
    () => ({
      authorizations,
      moduleRegistry: registry,
      token: "",
      user,
    }),
    [authorizations, registry, user],
  );
  const identityContext = useMemo<IdentityContextValue>(
    () => ({
      authHandler: {
        authenticate: async () => ({ user }),
        getIdentityToken: async () => "",
        logout: async () => undefined,
      },
      getIdentityToken: async () => "",
      localServers: localServerMap,
      logout: async () => undefined,
      moduleRegistry: registry,
      portalTarget: {
        connectionId: "local",
        restUrl: "local://",
        websocketUrl: "ws://local",
      },
      registry: vuuConnectionRegistry,
      user,
    }),
    [localServerMap, registry, user],
  );

  return (
    <IdentityContext.Provider value={identityContext}>
      <VuuConnectionContext.Provider value={{ connectionId: "local", session }}>
        {children}
      </VuuConnectionContext.Provider>
    </IdentityContext.Provider>
  );
};

export const AuthenticationProvider = (props: AuthenticationProviderProps) =>
  props.mode === "identity" ? (
    <IdentityAuthenticationProvider {...props} />
  ) : props.mode === "local" ? (
    <LocalAuthenticationProvider {...props} />
  ) : (
    <VuuConnectionAuthenticationProvider {...props} />
  );

export const useAuthenticatedUser = () => {
  const identity = useContext(IdentityContext);
  if (!identity) {
    throw new AuthenticationConfigurationError(
      "No identity AuthenticationProvider has been installed",
    );
  }
  return identity.user;
};

/** The authenticated user, or undefined when there is no identity provider. */
export const useOptionalAuthenticatedUser = () =>
  useContext(IdentityContext)?.user;

export const useIdentityToken = () => {
  const identity = useContext(IdentityContext);
  if (!identity) {
    throw new AuthenticationConfigurationError(
      "No identity AuthenticationProvider has been installed",
    );
  }
  return identity.getIdentityToken;
};

export const useModuleRegistry = () => {
  const identity = useContext(IdentityContext);
  if (!identity) {
    throw new AuthenticationConfigurationError(
      "No identity AuthenticationProvider has been installed",
    );
  }
  if (!identity.moduleRegistry) {
    throw new AuthenticationConfigurationError(
      "Portal LOGIN_SUCCESS did not include a module registry",
    );
  }
  if (!Array.isArray(identity.moduleRegistry.modules)) {
    throw new AuthenticationConfigurationError(
      "Portal LOGIN_SUCCESS module registry did not include a modules array",
    );
  }
  return identity.moduleRegistry;
};

export const usePortalVuuAuthTarget = () => {
  const identity = useContext(IdentityContext);
  if (!identity) {
    throw new AuthenticationConfigurationError(
      "No identity AuthenticationProvider has been installed",
    );
  }
  return identity.portalTarget;
};

const isUsableServer = (
  connection: RemoteModuleConnection,
  identity: IdentityContextValue,
) => {
  if (identity.localServers) {
    return identity.localServers.has(connection.connectionId);
  }
  try {
    normalizeVuuAuthTarget(connection, identity.portalTarget);
    return true;
  } catch {
    return false;
  }
};

/**
 * The distinct Vuu servers referenced by the `vuu` connections of registered
 * modules, in registry order. Servers that can't be connected to are
 * omitted: in local mode, those with no local implementation; otherwise,
 * those missing `restUrl` or `websocketUrl` that aren't the portal's own
 * server.
 */
export const useVuuServers = (): VuuServerDescriptor[] => {
  const identity = useContext(IdentityContext);
  return useMemo(() => {
    const servers = new Map<string, VuuServerDescriptor>();
    if (!identity) {
      return [];
    }
    for (const { title, vuu } of identity.moduleRegistry?.modules ?? []) {
      if (!vuu || !isUsableServer(vuu, identity)) {
        continue;
      }
      const server = servers.get(vuu.connectionId);
      if (server) {
        server.moduleTitles.push(title);
      } else {
        servers.set(vuu.connectionId, {
          connectionId: vuu.connectionId,
          moduleTitles: [title],
          ...(vuu.restUrl === undefined ? {} : { restUrl: vuu.restUrl }),
          ...(vuu.websocketUrl === undefined
            ? {}
            : { websocketUrl: vuu.websocketUrl }),
        });
      }
    }
    return Array.from(servers.values());
  }, [identity]);
};

export const useLogout = () => {
  const identity = useContext(IdentityContext);
  if (!identity) {
    throw new AuthenticationConfigurationError(
      "No identity AuthenticationProvider has been installed",
    );
  }
  return identity.logout;
};

export const useVuuAccessToken = () => {
  const connection = useContext(VuuConnectionContext);
  if (!connection) {
    throw new AuthenticationConfigurationError(
      "No authenticated VUU connection has been installed",
    );
  }
  return connection.session.token;
};

export const useVuuAuthorizations = () => {
  const connection = useContext(VuuConnectionContext);
  if (!connection) {
    throw new AuthenticationConfigurationError(
      "No authenticated VUU connection has been installed",
    );
  }
  return connection.session.authorizations;
};

export const useVuuConnectionId = () => {
  const connection = useContext(VuuConnectionContext);
  if (!connection) {
    throw new AuthenticationConfigurationError(
      "No authenticated VUU connection has been installed",
    );
  }
  return connection.connectionId;
};

export const useOptionalVuuConnectionId = () =>
  useContext(VuuConnectionContext)?.connectionId;
