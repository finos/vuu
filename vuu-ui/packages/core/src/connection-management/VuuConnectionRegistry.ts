import {
  ConnectionManager,
  type ConnectionStatus,
  type VuuConnectionResult,
} from "@vuu-ui/vuu-data-remote";
import type { AuthHandler } from "../auth/AuthHandler";
import {
  exchangeVuuToken,
  type VuuAuthTarget,
  type VuuSession,
} from "../auth/VuuTokenExchange";
import {
  IdentityTokenSessionResolver,
  type VuuSessionResolver,
} from "./VuuSessionResolver";

type EntryState =
  | "idle"
  | "authenticating"
  | "connecting"
  | "connected"
  | "failed";

type SessionListener = (session: VuuSession) => void;
type ErrorListener = (error: Error) => void;

type ConnectionRegistryEntry = {
  authHandler: AuthHandler;
  disconnectTimer?: ReturnType<typeof setTimeout>;
  intentionalDisconnect: boolean;
  errorListeners: Set<ErrorListener>;
  listeners: Set<SessionListener>;
  promise?: Promise<VuuSession>;
  reconnectPromise?: Promise<void>;
  refCount: number;
  session?: VuuSession;
  state: EntryState;
  target: VuuAuthTarget;
  unsubscribeStatus?: () => void;
};

export interface VuuConnectionClient {
  connectWithLoginResponseTo(
    connectionId: string,
    options: { token: string; url: string },
    throwOnRejected?: boolean,
  ): Promise<VuuConnectionResult>;
  connectedFor(connectionId: string): boolean;
  destroyConnection(connectionId: string): Promise<void>;
  onConnectionStatus(
    connectionId: string,
    listener: (status: ConnectionStatus) => void,
  ): () => void;
}

export interface VuuConnectionRegistryOptions {
  connectionClient?: VuuConnectionClient;
  exchangeToken?: typeof exchangeVuuToken;
  retryIntervals?: number[];
  sessionResolver?: VuuSessionResolver;
}

const connectionFailed = (status: ConnectionStatus) =>
  status === "connection-failed" ||
  status === "disconnected" ||
  status === "failed";

export class VuuConnectionRegistry {
  readonly #connectionClient: VuuConnectionClient;
  readonly #entries = new Map<string, ConnectionRegistryEntry>();
  readonly #retryIntervals: number[];
  readonly #sessionResolver: VuuSessionResolver;

  constructor({
    connectionClient = ConnectionManager,
    exchangeToken = exchangeVuuToken,
    retryIntervals = [1, 2, 3, 5, 10, 30, 60, 120],
    sessionResolver = new IdentityTokenSessionResolver(exchangeToken),
  }: VuuConnectionRegistryOptions = {}) {
    this.#connectionClient = connectionClient;
    this.#retryIntervals = retryIntervals;
    this.#sessionResolver = sessionResolver;
  }

  acquire(authHandler: AuthHandler, target: VuuAuthTarget) {
    const entry = this.#getOrCreateEntry(authHandler, target);
    if (entry.disconnectTimer) {
      clearTimeout(entry.disconnectTimer);
      entry.disconnectTimer = undefined;
    }
    entry.intentionalDisconnect = false;
    entry.refCount += 1;

    if (
      entry.session &&
      this.#connectionClient.connectedFor(target.connectionId)
    ) {
      return Promise.resolve(entry.session);
    }
    if (entry.promise) {
      return entry.promise;
    }
    if (entry.reconnectPromise) {
      return entry.reconnectPromise.then(() => {
        if (!entry.session || entry.state !== "connected") {
          throw Error(
            `VUU connection ${target.connectionId} failed to reconnect`,
          );
        }
        return entry.session;
      });
    }

    entry.promise = this.#authenticateAndConnect(entry).finally(() => {
      entry.promise = undefined;
    });
    return entry.promise;
  }

  release(connectionId: string) {
    const entry = this.#entries.get(connectionId);
    if (!entry) {
      return;
    }
    entry.refCount = Math.max(0, entry.refCount - 1);
    if (entry.refCount > 0 || entry.disconnectTimer) {
      return;
    }

    entry.disconnectTimer = setTimeout(() => {
      entry.disconnectTimer = undefined;
      if (entry.refCount === 0) {
        void this.#disconnectEntry(entry);
      }
    }, 0);
  }

  subscribe(
    connectionId: string,
    listener: SessionListener,
    errorListener?: ErrorListener,
  ) {
    const entry = this.#entries.get(connectionId);
    if (!entry) {
      throw Error(`VUU connection ${connectionId} has not been acquired`);
    }
    entry.listeners.add(listener);
    if (errorListener) {
      entry.errorListeners.add(errorListener);
    }
    return () => {
      entry.listeners.delete(listener);
      if (errorListener) {
        entry.errorListeners.delete(errorListener);
      }
    };
  }

  async disconnectAll() {
    await Promise.all(
      [...this.#entries.values()].map((entry) => this.#disconnectEntry(entry)),
    );
  }

  getRefCount(connectionId: string) {
    return this.#entries.get(connectionId)?.refCount ?? 0;
  }

  #getOrCreateEntry(authHandler: AuthHandler, target: VuuAuthTarget) {
    const existing = this.#entries.get(target.connectionId);
    if (existing) {
      if (
        existing.target.restUrl !== target.restUrl ||
        existing.target.websocketUrl !== target.websocketUrl
      ) {
        throw Error(
          `Connection ${target.connectionId} has conflicting VUU endpoints`,
        );
      }
      if (existing.authHandler !== authHandler) {
        throw Error(
          `Connection ${target.connectionId} cannot use multiple auth handlers`,
        );
      }
      return existing;
    }

    const entry: ConnectionRegistryEntry = {
      authHandler,
      errorListeners: new Set(),
      intentionalDisconnect: false,
      listeners: new Set(),
      refCount: 0,
      state: "idle",
      target,
    };
    this.#entries.set(target.connectionId, entry);
    return entry;
  }

  async #authenticateAndConnect(entry: ConnectionRegistryEntry) {
    entry.state = "authenticating";
    const session = await this.#sessionResolver.resolve(
      entry.authHandler,
      entry.target,
    );
    entry.state = "connecting";
    const connectionResult =
      await this.#connectionClient.connectWithLoginResponseTo(
        entry.target.connectionId,
        {
          token: session.token,
          url: entry.target.websocketUrl,
        },
        true,
      );
    const { status } = connectionResult;
    if (status !== "connected" && status !== "reconnected") {
      entry.state = "failed";
      throw Error(
        `VUU websocket connection ${entry.target.connectionId} failed with ${status}`,
      );
    }

    const connectedSession = {
      ...session,
      moduleRegistry: connectionResult.loginResponse.moduleRegistry,
    };
    entry.session = connectedSession;
    entry.state = "connected";
    entry.unsubscribeStatus ??= this.#connectionClient.onConnectionStatus(
      entry.target.connectionId,
      (nextStatus) => {
        if (
          !entry.intentionalDisconnect &&
          entry.refCount > 0 &&
          connectionFailed(nextStatus)
        ) {
          this.#reconnect(entry);
        }
      },
    );
    entry.listeners.forEach((listener) => {
      listener(connectedSession);
    });
    return connectedSession;
  }

  #reconnect(entry: ConnectionRegistryEntry) {
    if (entry.reconnectPromise) {
      return entry.reconnectPromise;
    }
    entry.reconnectPromise = (async () => {
      for (const interval of this.#retryIntervals) {
        await new Promise((resolve) => setTimeout(resolve, interval * 1000));
        if (entry.refCount === 0 || entry.intentionalDisconnect) {
          return;
        }
        try {
          await this.#authenticateAndConnect(entry);
          return;
        } catch {
          // Retry with a fresh identity and VUU token.
        }
      }
      entry.state = "failed";
      const error = Error(
        `VUU connection ${entry.target.connectionId} failed to reconnect`,
      );
      entry.errorListeners.forEach((listener) => {
        listener(error);
      });
    })().finally(() => {
      entry.reconnectPromise = undefined;
    });
    return entry.reconnectPromise;
  }

  async #disconnectEntry(entry: ConnectionRegistryEntry) {
    entry.intentionalDisconnect = true;
    if (entry.disconnectTimer) {
      clearTimeout(entry.disconnectTimer);
    }
    entry.unsubscribeStatus?.();
    if (entry.promise) {
      await entry.promise.catch(() => undefined);
    }
    entry.errorListeners.clear();
    entry.listeners.clear();
    this.#entries.delete(entry.target.connectionId);
    await this.#connectionClient.destroyConnection(entry.target.connectionId);
  }
}

export const vuuConnectionRegistry = new VuuConnectionRegistry();
