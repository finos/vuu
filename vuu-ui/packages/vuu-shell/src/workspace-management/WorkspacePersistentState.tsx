import {
  createContext,
  createElement,
  useContext,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  cloneWorkspaceValue,
  type ComponentPersistentStateV1,
} from "./workspace-schemas";

export type ComponentStateUpdate =
  | ComponentPersistentStateV1
  | ((
      current: ComponentPersistentStateV1 | undefined,
    ) => ComponentPersistentStateV1);

export class WorkspacePersistentStateStore {
  #state: Readonly<Record<string, ComponentPersistentStateV1>>;
  readonly #listeners = new Set<() => void>();

  constructor(
    initialState: Readonly<Record<string, ComponentPersistentStateV1>> = {},
  ) {
    this.#state = Object.freeze(cloneWorkspaceValue(initialState));
  }

  getSnapshot = (): Readonly<Record<string, ComponentPersistentStateV1>> =>
    this.#state;

  subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  };

  get(componentInstanceId: string): ComponentPersistentStateV1 | undefined {
    const value = this.#state[componentInstanceId];
    return value === undefined ? undefined : cloneWorkspaceValue(value);
  }

  update(componentInstanceId: string, update: ComponentStateUpdate): void {
    if (!componentInstanceId) {
      throw new Error("componentInstanceId must not be empty");
    }
    const next =
      typeof update === "function"
        ? update(this.get(componentInstanceId))
        : update;
    const captured = cloneWorkspaceValue(next);
    if (
      !captured.componentType ||
      !Number.isInteger(captured.schemaVersion) ||
      captured.schemaVersion < 1
    ) {
      throw new Error("Component persistent state metadata is invalid");
    }
    this.#state = Object.freeze({
      ...this.#state,
      [componentInstanceId]: captured,
    });
    this.#emit();
  }

  purge(componentInstanceId?: string): void {
    if (componentInstanceId === undefined) {
      if (Object.keys(this.#state).length > 0) {
        this.#state = Object.freeze({});
        this.#emit();
      }
      return;
    }
    if (this.#state[componentInstanceId] !== undefined) {
      const { [componentInstanceId]: removed, ...remaining } = this.#state;
      void removed;
      this.#state = Object.freeze(remaining);
      this.#emit();
    }
  }

  #emit(): void {
    this.#listeners.forEach((listener) => {
      listener();
    });
  }
}

const WorkspacePersistentStateContext =
  createContext<WorkspacePersistentStateStore | null>(null);

export interface WorkspacePersistentStateProviderProps {
  readonly children: ReactNode;
  readonly store: WorkspacePersistentStateStore;
}

export const WorkspacePersistentStateProvider = ({
  children,
  store,
}: WorkspacePersistentStateProviderProps): ReactElement =>
  createElement(
    WorkspacePersistentStateContext.Provider,
    { value: store },
    children,
  );

export const useWorkspacePersistentStateStore =
  (): WorkspacePersistentStateStore => {
    const store = useContext(WorkspacePersistentStateContext);
    if (!store) {
      throw new Error(
        "useWorkspacePersistentStateStore requires WorkspacePersistentStateProvider",
      );
    }
    return store;
  };

export const useComponentPersistentState = (
  componentInstanceId: string,
): readonly [
  ComponentPersistentStateV1 | undefined,
  (update: ComponentStateUpdate) => void,
  () => void,
] => {
  const store = useWorkspacePersistentStateStore();
  const state = useSyncExternalStore(
    store.subscribe,
    () => store.getSnapshot()[componentInstanceId],
    () => store.getSnapshot()[componentInstanceId],
  );
  return [
    state,
    (update) => store.update(componentInstanceId, update),
    () => store.purge(componentInstanceId),
  ];
};
