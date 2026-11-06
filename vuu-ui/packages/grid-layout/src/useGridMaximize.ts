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
  const maximizedId =
    maximized?.layoutKey === layoutKey ? maximized.id : undefined;

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
   * Returns false if there is no such item or stack.
   */
  const maximize = useCallback(
    (id: string) => {
      const stack = gridSnapshot.stacks.find(
        (candidate) => candidate.id === id || candidate.itemIds.includes(id),
      );
      const targetId =
        stack?.id ?? gridSnapshot.items.find((item) => item.id === id)?.id;
      if (targetId === undefined) {
        return false;
      }
      setMaximized({ id: targetId, layoutKey });
      return true;
    },
    [gridSnapshot, layoutKey],
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

  return { maximize, maximizedId, maximizedIdRef, restore, toggleMaximized };
};
