import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  useOptionalIdentityContext,
  useVuuServers,
} from "../auth/AuthenticationProvider";
import type { VuuServerAuthMode } from "@vuu-ui/vuu-data-types";
import {
  clearVuuServerCredentials,
  setVuuServerCredentials,
  type VuuServerCredentials,
} from "../auth/VuuServerLogin";
import { usePersistedState } from "../persistence/PersistenceContext";
import type { JsonValue } from "../persistence/StateDocument";

/** A Vuu server added by the user, rather than referenced by a module. */
export interface ManualVuuServer {
  /** Default `token-exchange`. */
  readonly auth?: VuuServerAuthMode;
  readonly connectionId: string;
  readonly restUrl: string;
  /** For `vuu-login`, the username to sign in with. */
  readonly username?: string;
  readonly websocketUrl: string;
}

/** Key of the user's added servers in the portal's saved state. */
export const MANUAL_VUU_SERVERS_KEY = "servers/manual";

export interface ManualVuuServersAPI {
  /**
   * Adds a server. For `vuu-login`, `credentials` are kept for this browser
   * session only; the password is never saved with the portal state.
   */
  readonly addServer: (
    server: ManualVuuServer,
    credentials?: VuuServerCredentials,
  ) => void;
  readonly removeServer: (connectionId: string) => void;
  readonly servers: readonly ManualVuuServer[];
}

const NO_SERVERS: readonly ManualVuuServer[] = [];

const NO_MANUAL_SERVERS: ManualVuuServersAPI = {
  addServer: () => undefined,
  removeServer: () => undefined,
  servers: NO_SERVERS,
};

const ManualVuuServersContext =
  createContext<ManualVuuServersAPI>(NO_MANUAL_SERVERS);

const isManualVuuServer = (value: unknown): value is ManualVuuServer => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const { auth, connectionId, restUrl, username, websocketUrl } =
    value as Record<string, unknown>;
  return (
    typeof connectionId === "string" &&
    connectionId.length > 0 &&
    typeof restUrl === "string" &&
    typeof websocketUrl === "string" &&
    (auth === undefined || auth === "token-exchange" || auth === "vuu-login") &&
    (username === undefined || typeof username === "string")
  );
};

const toSavedServer = ({
  auth,
  connectionId,
  restUrl,
  username,
  websocketUrl,
}: ManualVuuServer): JsonValue => ({
  connectionId,
  restUrl,
  websocketUrl,
  ...(auth === undefined ? {} : { auth }),
  ...(username === undefined ? {} : { username }),
});

const readServers = (
  value: JsonValue | undefined,
): readonly ManualVuuServer[] =>
  Array.isArray(value)
    ? (value as unknown[]).filter(isManualVuuServer)
    : NO_SERVERS;

/**
 * The Vuu servers the user has added, kept in the user's saved state of the
 * portal. PortalShell provides it; place it within the portal's
 * `ApplicationStateProvider` elsewhere.
 */
export const ManualVuuServersProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { load, save } = usePersistedState();
  const [servers, setServers] = useState<readonly ManualVuuServer[]>(() =>
    readServers(load(MANUAL_VUU_SERVERS_KEY)),
  );

  const update = useCallback(
    (
      change: (
        current: readonly ManualVuuServer[],
      ) => readonly ManualVuuServer[],
    ) =>
      setServers((current) => {
        const next = change(current);
        if (next !== current) {
          save(
            next.map(toSavedServer),
            MANUAL_VUU_SERVERS_KEY,
            { group: "Servers", label: "Added Vuu servers" },
          );
        }
        return next;
      }),
    [save],
  );

  const addServer = useCallback(
    (server: ManualVuuServer, credentials?: VuuServerCredentials) => {
      if (credentials) {
        setVuuServerCredentials(server.connectionId, credentials);
      }
      update((current) =>
        current.some(({ connectionId }) => connectionId === server.connectionId)
          ? current
          : [...current, server],
      );
    },
    [update],
  );

  const removeServer = useCallback(
    (connectionId: string) => {
      clearVuuServerCredentials(connectionId);
      update((current) =>
        current.some((server) => server.connectionId === connectionId)
          ? current.filter((server) => server.connectionId !== connectionId)
          : current,
      );
    },
    [update],
  );

  const value = useMemo(
    () => ({ addServer, removeServer, servers }),
    [addServer, removeServer, servers],
  );

  return (
    <ManualVuuServersContext.Provider value={value}>
      {children}
    </ManualVuuServersContext.Provider>
  );
};

/** The servers the user has added, with add and remove. */
export const useManualVuuServers = (): ManualVuuServersAPI =>
  useContext(ManualVuuServersContext);

export interface PortalVuuServer {
  readonly auth?: VuuServerAuthMode;
  readonly connectionId: string;
  /** True for a server the user added. */
  readonly manual: boolean;
  readonly restUrl?: string;
  readonly websocketUrl?: string;
}

/**
 * The Vuu servers to offer for browsing: the portal's own (or, in local
 * mode, local) servers, the servers of registered modules, then the servers
 * the user has added. In order, without duplicates.
 */
export const usePortalVuuServers = (): readonly PortalVuuServer[] => {
  const identity = useOptionalIdentityContext();
  const moduleServers = useVuuServers();
  const { servers: manualServers } = useManualVuuServers();
  return useMemo(() => {
    const servers = new Map<string, PortalVuuServer>();
    const add = (server: PortalVuuServer) => {
      if (server.connectionId && !servers.has(server.connectionId)) {
        servers.set(server.connectionId, server);
      }
    };
    if (identity?.localServers) {
      for (const connectionId of identity.localServers.keys()) {
        add({ connectionId, manual: false });
      }
    } else {
      if (identity) {
        add({ ...identity.portalTarget, manual: false });
      }
      for (const { moduleTitles: _moduleTitles, ...server } of moduleServers) {
        add({ ...server, manual: false });
      }
    }
    for (const server of manualServers) {
      const { username: _username, ...connection } = server;
      add({ ...connection, manual: true });
    }
    return Array.from(servers.values());
  }, [identity, manualServers, moduleServers]);
};
