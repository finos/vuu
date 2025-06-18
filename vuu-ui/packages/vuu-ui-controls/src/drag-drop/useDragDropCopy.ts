import { useCallback, useRef } from "react";

import type {
  InternalDragDropProps,
  InternalDragHookResult,
  ViewportRange,
} from "./dragDropTypes";

export const NULL_DROP_OPTIONS = {
  fromIndex: -1,
  toIndex: -1,
} as const;

export const useDragDropCopy = ({
  selected,
  viewportRange,
}: InternalDragDropProps): InternalDragHookResult => {
  const rangeRef = useRef<ViewportRange>(undefined);
  rangeRef.current = viewportRange;

  const beginDrag = useCallback(
    (dragElement: HTMLElement) => {
      if (
        dragElement.ariaSelected &&
        Array.isArray(selected) &&
        selected.length > 1
      ) {
        console.log("its a selected element, and we have a multi select");
      }
    },
    [selected],
  );

  const drag = useCallback(() => undefined, []);
  const drop = useCallback(() => NULL_DROP_OPTIONS, []);

  return {
    beginDrag,
    drag,
    drop,
  };
};
