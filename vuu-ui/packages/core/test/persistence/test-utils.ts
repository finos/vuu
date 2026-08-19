import type { StateDocument, StateEntry } from "../../src/persistence";

/** A Storage with an optional byte quota, for exercising quota handling. */
export class MemoryStorage implements Storage {
  #items = new Map<string, string>();
  quota = Number.POSITIVE_INFINITY;

  get length() {
    return this.#items.size;
  }
  clear() {
    this.#items.clear();
  }
  getItem(key: string) {
    return this.#items.get(key) ?? null;
  }
  key(index: number) {
    return [...this.#items.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.#items.delete(key);
  }
  setItem(key: string, value: string) {
    let size = (key.length + value.length) * 2;
    for (const [k, v] of this.#items) {
      if (k !== key) size += (k.length + v.length) * 2;
    }
    if (size > this.quota) {
      const error = new Error("quota exceeded");
      error.name = "QuotaExceededError";
      throw error;
    }
    this.#items.set(key, value);
  }
  keys() {
    return [...this.#items.keys()];
  }
}

export const entry = (
  value: StateEntry["value"],
  extra: Partial<StateEntry> = {},
): StateEntry => ({
  value,
  updatedAt: "2025-01-01T00:00:00.000Z",
  ...extra,
});

export const stateDocument = (
  props: Partial<StateDocument> & {
    applicationKey: string;
    applicationVersion: number;
  },
): StateDocument => ({
  schemaVersion: 1,
  user: "steve",
  revision: 1,
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
  entries: {},
  ...props,
});

export const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
