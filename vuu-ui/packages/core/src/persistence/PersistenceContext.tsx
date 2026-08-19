import { type ReactNode, createContext, useContext, useMemo } from "react";
import type { ApplicationStateStore } from "./ApplicationStateStore";
import type { PortalPersistenceService } from "./PortalPersistenceService";
import type { EntryMetadata, JsonValue } from "./StateDocument";
import { useStoreReady } from "./useStoreReady";

const PortalPersistenceContext = createContext<
  PortalPersistenceService | undefined
>(undefined);

export const PortalPersistenceProvider = ({
  children,
  service,
}: {
  children: ReactNode;
  service: PortalPersistenceService | undefined;
}) => (
  <PortalPersistenceContext.Provider value={service}>
    {children}
  </PortalPersistenceContext.Provider>
);

/** The shell's persistence service. Throws outside a portal shell. */
export function usePortalPersistence(): PortalPersistenceService {
  const service = useContext(PortalPersistenceContext);
  if (!service) {
    throw Error(
      "usePortalPersistence must be used within a PortalShell (or PortalPersistenceProvider)",
    );
  }
  return service;
}

export function useOptionalPortalPersistence():
  | PortalPersistenceService
  | undefined {
  return useContext(PortalPersistenceContext);
}

/**
 * `null` means no provider at all. A provider with an `undefined` store is how
 * `RemoteModule` hides the portal's own store from an application that has
 * no store of its own (FR-3).
 */
const ApplicationStateContext = createContext<
  ApplicationStateStore | undefined | null
>(null);

export const ApplicationStateProvider = ({
  children,
  store,
}: {
  children: ReactNode;
  store: ApplicationStateStore | undefined;
}) => (
  <ApplicationStateContext.Provider value={store}>
    {children}
  </ApplicationStateContext.Provider>
);

/** The store for the enclosing application. Throws outside a portal application. */
export function useApplicationState(): ApplicationStateStore {
  const store = useContext(ApplicationStateContext);
  if (!store) {
    throw Error(
      "useApplicationState must be used within an application hosted by a portal. Use useOptionalApplicationState in code that can also run standalone.",
    );
  }
  return store;
}

/** Same, but returns undefined when not hosted by a portal (standalone apps, tests). */
export function useOptionalApplicationState():
  | ApplicationStateStore
  | undefined {
  return useContext(ApplicationStateContext) ?? undefined;
}

/** Every value saved for the application, by key. */
export type PersistedStateDocument = Readonly<Record<string, JsonValue>>;

export interface PersistedStateAPI {
  /**
   * With a `key`, returns the value saved under it. Without one, returns the
   * whole saved state for this user and application. Returns undefined if
   * nothing is saved. Synchronous: saved state has been loaded before the
   * module renders.
   */
  load: {
    <T extends JsonValue = JsonValue>(key: string): T | undefined;
    <T extends object = PersistedStateDocument>(): T | undefined;
  };
  /**
   * Saves `state` under `key`. Fire and forget: the write is debounced and
   * asynchronous, and does not cause a render.
   */
  save: (state: JsonValue, key: string, metadata?: EntryMetadata) => void;
}

const NO_PERSISTED_STATE: PersistedStateAPI = {
  load: (() => undefined) as PersistedStateAPI["load"],
  save: () => undefined,
};

const createPersistedStateAPI = (
  store: ApplicationStateStore,
): PersistedStateAPI => ({
  load: ((key?: string) => {
    if (key !== undefined) {
      return store.get(key);
    }
    return store.keys().length > 0 ? store.getAll() : undefined;
  }) as PersistedStateAPI["load"],
  save: (state, key, metadata) => store.set(key, state, metadata),
});

/**
 * load/save for the saved state of the enclosing remote module (provided by
 * RemoteModule) or, in the portal's own components, the portal (provided by
 * PortalShell). Both are pre-scoped to the user and application, so the only
 * key a caller supplies is the key of a value within that state. Calls to save do not trigger a render; saving is an
 * after-effect of a change of state the component already manages itself.
 * Outside a portal, load returns undefined and save does nothing.
 */
export function usePersistedState(): PersistedStateAPI {
  const store = useOptionalApplicationState();
  useStoreReady(store);
  return useMemo(
    () => (store ? createPersistedStateAPI(store) : NO_PERSISTED_STATE),
    [store],
  );
}
