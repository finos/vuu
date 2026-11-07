import type { GridModelCheckpoint } from "./GridModel";

export type GridHistoryKind = "undo" | "redo";

export const DEFAULT_GRID_HISTORY_LIMIT = 50;
export const GRID_HISTORY_COALESCE_MS = 1000;

/** A grid whose committed changes are recorded in a GridHistory. */
export interface GridHistoryTarget {
  isTransactionActive(): boolean;
  restoreFromHistory(
    checkpoint: GridModelCheckpoint,
    kind: GridHistoryKind,
  ): void;
}

interface GridHistoryEntry {
  after: GridModelCheckpoint;
  readonly before: GridModelCheckpoint;
  committedAt: number;
  readonly historyKey?: string;
  readonly target: GridHistoryTarget;
}

export interface GridHistoryOptions {
  /** The most undo steps kept. Defaults to `DEFAULT_GRID_HISTORY_LIMIT`. */
  readonly limit?: number;
}

/**
 * Undo and redo steps for one or more grids. Grids nested within a
 * GridLayoutProvider share one history, so undo reverts the most recent change
 * whichever grid it was made in.
 */
export class GridHistory {
  readonly #limit: number;
  readonly #listeners = new Set<() => void>();
  #redoStack: GridHistoryEntry[] = [];
  #undoStack: GridHistoryEntry[] = [];

  constructor({ limit = DEFAULT_GRID_HISTORY_LIMIT }: GridHistoryOptions = {}) {
    this.#limit = limit;
  }

  canUndo = () => this.#undoStack.length > 0;

  canRedo = () => this.#redoStack.length > 0;

  subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  /**
   * Records a committed change to `target`, given the model checkpoints from
   * before and after it. Consecutive changes to the same target with the same
   * `historyKey`, each within `GRID_HISTORY_COALESCE_MS` of the last, are one
   * step.
   */
  record(
    target: GridHistoryTarget,
    before: GridModelCheckpoint,
    after: GridModelCheckpoint,
    historyKey?: string,
  ) {
    const now = Date.now();
    const last = this.#undoStack.at(-1);
    this.#redoStack = [];
    if (
      last &&
      last.target === target &&
      historyKey !== undefined &&
      last.historyKey === historyKey &&
      now - last.committedAt <= GRID_HISTORY_COALESCE_MS
    ) {
      last.after = after;
      last.committedAt = now;
    } else {
      this.#undoStack.push({
        after,
        before,
        committedAt: now,
        historyKey,
        target,
      });
      if (this.#undoStack.length > this.#limit) {
        this.#undoStack.splice(0, this.#undoStack.length - this.#limit);
      }
    }
    this.#notify();
  }

  /**
   * Records a committed change to `target` that is not a step of its own. If
   * the last step was a change to `target`, it now ends in this state, so
   * undo then redo returns here.
   */
  recordUntracked(target: GridHistoryTarget, after: GridModelCheckpoint) {
    const last = this.#undoStack.at(-1);
    if (last?.target === target) {
      last.after = after;
    }
  }

  /**
   * Reverts the last recorded change. Returns false if there is nothing to
   * undo or the grid it was made in has an active transaction.
   */
  undo(): boolean {
    const entry = this.#undoStack.at(-1);
    if (entry === undefined || entry.target.isTransactionActive()) {
      return false;
    }
    this.#undoStack.pop();
    this.#redoStack.push(entry);
    entry.target.restoreFromHistory(entry.before, "undo");
    this.#notify();
    return true;
  }

  /**
   * Reapplies the last undone change. Returns false if there is nothing to
   * redo or the grid it was made in has an active transaction.
   */
  redo(): boolean {
    const entry = this.#redoStack.at(-1);
    if (entry === undefined || entry.target.isTransactionActive()) {
      return false;
    }
    this.#redoStack.pop();
    this.#undoStack.push(entry);
    entry.target.restoreFromHistory(entry.after, "redo");
    this.#notify();
    return true;
  }

  /** Removes the steps of `target`, or every step. */
  clear(target?: GridHistoryTarget) {
    const keep = (entry: GridHistoryEntry) =>
      target !== undefined && entry.target !== target;
    const undoStack = this.#undoStack.filter(keep);
    const redoStack = this.#redoStack.filter(keep);
    if (
      undoStack.length !== this.#undoStack.length ||
      redoStack.length !== this.#redoStack.length
    ) {
      this.#undoStack = undoStack;
      this.#redoStack = redoStack;
      this.#notify();
    }
  }

  /** Ids of the items of `target` in every layout undo or redo can restore. */
  getItemIds(target: GridHistoryTarget): ReadonlySet<string> {
    const ids = new Set<string>();
    for (const entry of [...this.#undoStack, ...this.#redoStack]) {
      if (entry.target === target) {
        for (const { item } of [
          ...entry.before.childItems,
          ...entry.after.childItems,
        ]) {
          ids.add(item.id);
        }
      }
    }
    return ids;
  }

  #notify() {
    for (const listener of [...this.#listeners]) {
      if (this.#listeners.has(listener)) {
        listener();
      }
    }
  }
}
