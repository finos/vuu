import { useCallback, useEffect, useRef, useState } from "react";
import type { GridSnapshot } from "./GridSnapshot";

/** Called with the id of the newly maximized item or stack, or undefined. */
export type GridMaximizedChangeHandler = (
  maximizedId: string | undefined,
) => void;

export interface GridMaximizeHookProps {
  gridSnapshot: GridSnapshot;
  onMaximizedChange?: GridMaximizedChangeHandler;
}

/**
 * The item or stack that fills the grid. Maximizing is view state, not part
 * of the layout: any change to the set of items or stacks restores the grid.
 *
 * Content hosted in an item can refuse to be maximized. A refused item, or a
 * stack whose selected item is refused, can't be maximized, and the grid is
 * restored if it already is.
 */
export const useGridMaximize = ({
  gridSnapshot,
  onMaximizedChange,
}: GridMaximizeHookProps) => {
  const layoutKey = [
    ...gridSnapshot.items.map(({ id }) => id),
    ...gridSnapshot.stacks.map(({ id }) => id),
  ].join("\u0000");
  const [maximized, setMaximized] = useState<{
    id: string;
    layoutKey: string;
  }>();
  const [refusedIds, setRefusedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const isRefused = useCallback(
    (id: string) => {
      const stack = gridSnapshot.stacks.find(
        (candidate) => candidate.id === id,
      );
      return refusedIds.has(stack ? stack.selectedItemId : id);
    },
    [gridSnapshot, refusedIds],
  );

  const maximizedId =
    maximized?.layoutKey === layoutKey && !isRefused(maximized.id)
      ? maximized.id
      : undefined;

  /** Records whether the content of item `itemId` allows maximize. */
  const setContentMaximizable = useCallback(
    (itemId: string, maximizable: boolean) => {
      setRefusedIds((current) => {
        if (current.has(itemId) === !maximizable) {
          return current;
        }
        const next = new Set(current);
        if (maximizable) {
          next.delete(itemId);
        } else {
          next.add(itemId);
        }
        return next;
      });
    },
    [],
  );

  // Once restored by a layout change or a refusal, stay restored.
  useEffect(() => {
    if (maximized && maximizedId === undefined) {
      setMaximized(undefined);
    }
  }, [maximized, maximizedId]);

  const maximizedIdRef = useRef(maximizedId);
  const reportedIdRef = useRef(maximizedId);
  useEffect(() => {
    maximizedIdRef.current = maximizedId;
    if (reportedIdRef.current !== maximizedId) {
      reportedIdRef.current = maximizedId;
      onMaximizedChange?.(maximizedId);
    }
  }, [maximizedId, onMaximizedChange]);

  /**
   * Maximizes an item or stack. A stack member's id maximizes its stack.
   * Returns false if there is no such item or stack, or its content refuses.
   */
  const maximize = useCallback(
    (id: string) => {
      const stack = gridSnapshot.stacks.find(
        (candidate) => candidate.id === id || candidate.itemIds.includes(id),
      );
      const targetId =
        stack?.id ?? gridSnapshot.items.find((item) => item.id === id)?.id;
      if (targetId === undefined || isRefused(targetId)) {
        return false;
      }
      setMaximized({ id: targetId, layoutKey });
      return true;
    },
    [gridSnapshot, isRefused, layoutKey],
  );

  const restore = useCallback(() => setMaximized(undefined), []);

  const toggleMaximized = useCallback(
    (id: string) => {
      if (id === maximizedId) {
        restore();
      } else {
        maximize(id);
      }
    },
    [maximize, maximizedId, restore],
  );

  return {
    maximize,
    maximizedId,
    maximizedIdRef,
    refusedIds,
    restore,
    setContentMaximizable,
    toggleMaximized,
  };
};
