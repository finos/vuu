import { ConnectionManager, VuuDataSource } from "@vuu-ui/vuu-data-remote";
import type {
  DataSourceConstructorProps,
  RemoteModuleConnection,
} from "@vuu-ui/vuu-data-types";
import { DataProvider } from "../context-definitions/DataProvider";
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
} from "./VuuConnectionRegistry";
import type { VuuAuthTarget, VuuSession } from "./VuuTokenExchange";

export class AuthenticationConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationConfigurationError";
  }
}

export class VuuConnectionError extends Error {
  constructor(
    readonly connectionId: string,
    cause: unknown,
  ) {
    super(`VUU connection authentication failed for ${connectionId}`, {
      cause,
    });
    this.name = "VuuConnectionError";
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

export type AuthenticationProviderProps =
  | IdentityAuthenticationProps
  | VuuConnectionAuthenticationProps;

interface IdentityContextValue {
  authHandler: AuthHandler;
  getIdentityToken: () => Promise<string>;
  logout: () => Promise<void>;
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

export const AuthenticationProvider = (props: AuthenticationProviderProps) =>
  props.mode === "identity" ? (
    <IdentityAuthenticationProvider {...props} />
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

export const useIdentityToken = () => {
  const identity = useContext(IdentityContext);
  if (!identity) {
    throw new AuthenticationConfigurationError(
      "No identity AuthenticationProvider has been installed",
    );
  }
  return identity.getIdentityToken;
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
