import { useCallback, useEffect, useRef, useState } from "react";
import type { GridSnapshot } from "./GridSnapshot";

/** Called with the id of the newly maximised item or stack, or undefined. */
export type GridMaximisedChangeHandler = (
  maximisedId: string | undefined,
) => void;

export interface GridMaximiseHookProps {
  gridSnapshot: GridSnapshot;
  onMaximisedChange?: GridMaximisedChangeHandler;
}

/**
 * The item or stack that fills the grid. Maximising is view state, not part
 * of the layout: any change to the set of items or stacks restores the grid.
 */
export const useGridMaximise = ({
  gridSnapshot,
  onMaximisedChange,
}: GridMaximiseHookProps) => {
  const layoutKey = [
    ...gridSnapshot.items.map(({ id }) => id),
    ...gridSnapshot.stacks.map(({ id }) => id),
  ].join("\u0000");
  const [maximised, setMaximised] = useState<{
    id: string;
    layoutKey: string;
  }>();
  const maximisedId =
    maximised?.layoutKey === layoutKey ? maximised.id : undefined;

  const maximisedIdRef = useRef(maximisedId);
  const reportedIdRef = useRef(maximisedId);
  useEffect(() => {
    maximisedIdRef.current = maximisedId;
    if (reportedIdRef.current !== maximisedId) {
      reportedIdRef.current = maximisedId;
      onMaximisedChange?.(maximisedId);
    }
  }, [maximisedId, onMaximisedChange]);

  /**
   * Maximises an item or stack. A stack member's id maximises its stack.
   * Returns false if there is no such item or stack.
   */
  const maximise = useCallback(
    (id: string) => {
      const stack = gridSnapshot.stacks.find(
        (candidate) => candidate.id === id || candidate.itemIds.includes(id),
      );
      const targetId =
        stack?.id ?? gridSnapshot.items.find((item) => item.id === id)?.id;
      if (targetId === undefined) {
        return false;
      }
      setMaximised({ id: targetId, layoutKey });
      return true;
    },
    [gridSnapshot, layoutKey],
  );

  const restore = useCallback(() => setMaximised(undefined), []);

  const toggleMaximised = useCallback(
    (id: string) => {
      if (id === maximisedId) {
        restore();
      } else {
        maximise(id);
      }
    },
    [maximise, maximisedId, restore],
  );

  return { maximise, maximisedId, maximisedIdRef, restore, toggleMaximised };
};
