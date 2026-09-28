import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { ApplicationStateStore } from "./ApplicationStateStore";
import type { PortalPersistenceService } from "./PortalPersistenceService";
import type { EntryMetadata, JsonValue } from "./StateDocument";

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

type SetPersistentState<T> = (value: T | ((previous: T) => T)) => void;

const noopSubscribe = () => () => undefined;

/**
 * useState-like hook backed by the store. Returns defaultValue when there is
 * no saved value, and reverts to defaultValue when the key is cleared. Outside
 * a portal it behaves like useState (FR-17).
 */
export function usePersistentState<T extends JsonValue>(
  key: string,
  defaultValue: T,
  metadata?: EntryMetadata,
): [T, SetPersistentState<T>] {
  const store = useOptionalApplicationState();
  const defaultRef = useRef(defaultValue);
  defaultRef.current = defaultValue;
  const [localValue, setLocalValue] = useState<T>(defaultValue);

  const subscribe = useCallback(
    (onChange: () => void) =>
      store
        ? store.subscribe((event) => {
            if (event.keys.length === 0 || event.keys.includes(key)) {
              onChange();
            }
          })
        : noopSubscribe(),
    [key, store],
  );
  const getSnapshot = useCallback(
    () => (store ? store.get<T>(key) : undefined),
    [key, store],
  );
  const storedValue = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const label = metadata?.label;
  const group = metadata?.group;
  useEffect(() => {
    if (store && (label !== undefined || group !== undefined)) {
      store.describe(key, { label, group });
    }
  }, [group, key, label, store]);

  const setValue = useCallback<SetPersistentState<T>>(
    (value) => {
      if (!store) {
        setLocalValue(value);
        return;
      }
      const previous = store.get<T>(key) ?? defaultRef.current;
      const next =
        typeof value === "function"
          ? (value as (previous: T) => T)(previous)
          : value;
      store.set<T>(key, next, { label, group });
    },
    [group, key, label, store],
  );

  if (!store) {
    return [localValue, setValue];
  }
  return [storedValue ?? defaultValue, setValue];
}
