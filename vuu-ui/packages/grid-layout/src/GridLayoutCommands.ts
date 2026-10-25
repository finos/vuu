import type { GridLayoutSplitDirection } from "@vuu-ui/vuu-utils";
import type { ComponentTemplate } from "./GridLayoutContext";
import type { GridItemId, GridSnapshot } from "./GridSnapshot";

/**
 * Where a component template is inserted by `GridLayoutCommands.insertTemplate`.
 * These are the placements a drag can achieve, without the drag.
 *
 * - `replace` fills a placeholder or replaces the content of an item. A stack
 *   member is replaced in place, keeping its position in the stack.
 * - `split` splits the target (or the stack the target belongs to).
 * - `stack` stacks the new item with the target as a new, selected tab. A
 *   standalone target becomes a stack.
 */
export type GridTemplatePlacement =
  | { readonly kind: "replace"; readonly targetId: GridItemId }
  | {
      readonly kind: "split";
      readonly position: GridLayoutSplitDirection;
      readonly targetId: GridItemId;
    }
  | { readonly kind: "stack"; readonly targetId: GridItemId };

/**
 * Programmatic control of a mounted GridLayout, for components rendered
 * outside the grid (e.g. a palette) within the same GridLayoutProvider.
 */
export interface GridLayoutCommands {
  readonly gridId: string;
  /** Ids of items that hold content, in snapshot order. */
  getContentItemIds: () => readonly GridItemId[];
  /** Ids of empty (placeholder) items, in snapshot order. */
  getPlaceholderIds: () => readonly GridItemId[];
  getSnapshot: () => GridSnapshot;
  /**
   * Insert a component rendered from template. Returns the id of the new
   * item. Throws if the placement is not possible, or a drag is in progress.
   */
  insertTemplate: (
    template: ComponentTemplate,
    placement: GridTemplatePlacement,
  ) => GridItemId;
  /** Subscribe to snapshot changes. */
  subscribe: (listener: () => void) => () => void;
}

export type GridLayoutCommandsListener = () => void;

/**
 * Registry of the GridLayout commands mounted within a GridLayoutProvider.
 */
export class GridLayoutCommandsRegistry {
  readonly #commands = new Map<string, GridLayoutCommands>();
  readonly #listeners = new Set<GridLayoutCommandsListener>();
  #version = 0;

  get = (gridId?: string) =>
    gridId === undefined
      ? this.#commands.values().next().value
      : this.#commands.get(gridId);

  getVersion = () => this.#version;

  register = (commands: GridLayoutCommands) => {
    this.#commands.set(commands.gridId, commands);
    this.#notify();
    return () => {
      if (this.#commands.get(commands.gridId) === commands) {
        this.#commands.delete(commands.gridId);
        this.#notify();
      }
    };
  };

  subscribe = (listener: GridLayoutCommandsListener) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  #notify() {
    this.#version += 1;
    for (const listener of this.#listeners) {
      listener();
    }
  }
}
