import {
  createContext,
  type RefCallback,
  useCallback,
  useContext,
} from "react";
import { GridLayoutContext } from "./GridLayoutContext";

/**
 * Where a hosted component's contribution is rendered.
 *
 * - `start`, `title`, `center`, `end` target the GridLayoutItem header. When the
 *   item is stacked, `start`, `center` and `end` target the stack's tab bar, and
 *   are filled by the selected tab's component. `title` replaces the default
 *   title and applies only to an unstacked item.
 * - `tab-start`, `tab-end` target the item's own tab, and apply only when the
 *   item is stacked.
 */
export type GridLayoutHeaderLocation =
  | "start"
  | "title"
  | "center"
  | "end"
  | "tab-start"
  | "tab-end";

type Listener = () => void;

const slotKey = (itemId: string, location: GridLayoutHeaderLocation) =>
  `${itemId}\u0000${location}`;

/**
 * Registry of the DOM elements that header contributions portal into, keyed by
 * GridLayoutItem id and location. Headers and tab bars register their slot
 * elements; contributions look them up.
 */
export class GridLayoutHeaderSlots {
  #listeners = new Set<Listener>();
  #slots = new Map<string, HTMLElement>();

  getSlot(itemId: string, location: GridLayoutHeaderLocation) {
    return this.#slots.get(slotKey(itemId, location));
  }

  setSlot(
    itemId: string,
    location: GridLayoutHeaderLocation,
    element: HTMLElement,
  ) {
    const key = slotKey(itemId, location);
    if (this.#slots.get(key) !== element) {
      this.#slots.set(key, element);
      this.#notify();
    }
  }

  /**
   * Removes the slot only if it is still held by `element`, so a slot that has
   * already been claimed by a newly mounted header is left alone.
   */
  clearSlot(
    itemId: string,
    location: GridLayoutHeaderLocation,
    element: HTMLElement,
  ) {
    const key = slotKey(itemId, location);
    if (this.#slots.get(key) === element) {
      this.#slots.delete(key);
      this.#notify();
    }
  }

  subscribe = (listener: Listener) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  #notify() {
    for (const listener of this.#listeners) {
      listener();
    }
  }
}

/**
 * Used when a GridLayoutItem renders outside a GridLayout.
 */
const defaultHeaderSlots = new GridLayoutHeaderSlots();

/**
 * The slot registry of the enclosing GridLayout.
 */
export const useGridLayoutHeaderSlots = () =>
  useContext(GridLayoutContext).headerSlots ?? defaultHeaderSlots;

/**
 * Returns a ref callback that registers the element as the slot for
 * `itemId` + `location`. Changing `itemId` moves the registration.
 */
export const useHeaderSlotRef = (
  itemId: string | undefined,
  location: GridLayoutHeaderLocation,
): RefCallback<HTMLElement> => {
  const slots = useGridLayoutHeaderSlots();
  return useCallback(
    (element: HTMLElement | null) => {
      if (element && itemId !== undefined) {
        slots.setSlot(itemId, location, element);
        return () => slots.clearSlot(itemId, location, element);
      }
    },
    [itemId, location, slots],
  );
};

export interface GridLayoutItemContextValue {
  id: string;
  /**
   * The slot registry of the GridLayout that owns this item. Held here, rather
   * than read from context by the contribution, so that a contribution inside a
   * nested GridLayout still targets the item that hosts it.
   */
  slots: GridLayoutHeaderSlots;
  stacked: boolean;
  title?: string;
}

export const GridLayoutItemContext = createContext<
  GridLayoutItemContextValue | undefined
>(undefined);

/**
 * Details of the GridLayoutItem hosting the calling component, or undefined
 * when it is not hosted in a GridLayoutItem.
 */
export const useGridLayoutItem = () => {
  const context = useContext(GridLayoutItemContext);
  if (context) {
    const { id, stacked, title } = context;
    return { id, stacked, title };
  }
};
