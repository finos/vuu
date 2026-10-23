import { useSyncExternalStore } from "react";

export const FAVOURITES_KEY = "vuu-showcase.favourites";
export const RECENT_KEY = "vuu-showcase.recent";
export const MAX_RECENT = 10;

type Listener = () => void;

/**
 * A list of url paths persisted to localStorage, which components can
 * subscribe to via useSyncExternalStore.
 */
export class PathListStore {
  #listeners = new Set<Listener>();
  #paths: string[] | undefined;

  constructor(
    private storageKey: string,
    private maxSize = Infinity,
  ) {}

  subscribe = (listener: Listener) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  getSnapshot = (): string[] => {
    if (this.#paths === undefined) {
      this.#paths = this.load();
    }
    return this.#paths;
  };

  has(path: string) {
    return this.getSnapshot().includes(path);
  }

  /** Adds path at the front of the list, moving it if already present */
  push(path: string) {
    const paths = this.getSnapshot();
    if (paths[0] !== path) {
      this.update(
        [path, ...paths.filter((p) => p !== path)].slice(0, this.maxSize),
      );
    }
  }

  toggle(path: string) {
    const paths = this.getSnapshot();
    this.update(
      paths.includes(path)
        ? paths.filter((p) => p !== path)
        : [...paths, path].slice(0, this.maxSize),
    );
  }

  private load(): string[] {
    try {
      const value = JSON.parse(localStorage.getItem(this.storageKey) ?? "[]");
      return Array.isArray(value)
        ? value.filter((p): p is string => typeof p === "string")
        : [];
    } catch {
      return [];
    }
  }

  private update(paths: string[]) {
    this.#paths = paths;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(paths));
    } catch {
      // storage may be unavailable, the list survives for this session only
    }
    this.#listeners.forEach((listener) => listener());
  }
}

export const favouritesStore = new PathListStore(FAVOURITES_KEY);
export const recentStore = new PathListStore(RECENT_KEY, MAX_RECENT);

const usePathList = (store: PathListStore) =>
  useSyncExternalStore(store.subscribe, store.getSnapshot);

export const useFavourites = () => usePathList(favouritesStore);
export const useRecent = () => usePathList(recentStore);
