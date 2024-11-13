import { createContext, ReactNode, useContext, useMemo, useState } from "react";

export interface TableColumnContext {
  allValues: unknown[];
  getValue: (key: string) => unknown;
  recent: string[];
  setValue: (key: string, value: unknown) => void;
  itemUsed: (key: string) => void;
}

const getOldestEntry = (map: Map<string, number>) => {
  const [key] = map
    .entries()
    .reduce(
      (entry, min) => (entry[1] < min[1] ? entry : min),
      ["", Number.MAX_SAFE_INTEGER],
    );
  return key;
};

class TableColumnContextStore implements TableColumnContext {
  #map = new Map<string, unknown>();
  #maxRecent: number;
  #onUpdate: () => void;
  /**
   * map of key value to most recent use time
   */
  #recent = new Map<string, number>();

  constructor(onUpdate: () => void, maxRecent = 10) {
    this.#maxRecent = maxRecent;
    this.#onUpdate = onUpdate;
  }
  get allValues() {
    return Array.from(this.#map.keys());
  }
  // Limitation: there is currently no way to have the recent list appear
  // in time order in the list. Thats because the data is sorted by the
  // dataSource and that does not have client side information.
  get recent() {
    return Array.from(this.#recent.entries()).map(([key]) => key);
  }

  getValue = (key: string) => {
    return this.#map.get(key);
  };
  setValue = (key: string, value: unknown) => {
    if (value) {
      this.#map.set(key, value);
    } else {
      this.#map.delete(key);
    }
    this.#onUpdate();
  };
  /**
   * Using the item means we make sure its in the cache. The caller
   * decides what constitutes 'using'.
   */
  itemUsed = (key: string) => {
    const alreadyInCache = this.#recent.has(key);
    this.#recent.set(key, performance.now());

    if (!alreadyInCache && this.#recent.size > this.#maxRecent) {
      const oldestKey = getOldestEntry(this.#recent);
      this.#recent.delete(oldestKey);
    }
    this.#onUpdate();
  };
}

const ClientTableColumnContext = createContext<TableColumnContext>({
  allValues: [],
  getValue: () => {
    console.warn(`no TableColumnProvider has been installed`);
  },
  recent: [],
  setValue: () => {
    console.warn(`no TableColumnProvider has been installed`);
  },
  itemUsed: () => {
    console.warn(`no TableColumnProvider has been installed`);
  },
});

export const ClientTableColumnProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [, forceRefresh] = useState({});
  const store = useMemo(
    () =>
      new TableColumnContextStore(() => {
        console.log("force refresh");
        forceRefresh({});
      }, 6),
    [],
  );

  const { allValues, getValue, recent, setValue, itemUsed: useItem } = store;
  return (
    <ClientTableColumnContext.Provider
      value={{ allValues, getValue, recent, setValue, itemUsed: useItem }}
    >
      {children}
    </ClientTableColumnContext.Provider>
  );
};

export const useClientTableColumn = () => useContext(ClientTableColumnContext);
