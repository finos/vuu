import { useCallback, useRef } from "react";

import {
  InternalDragDropProps,
  InternalDragHookResult,
  ViewportRange,
} from "./dragDropTypes";

export const useDragDropCopy = ({
  selected,
  viewportRange,
}: InternalDragDropProps): InternalDragHookResult => {
  const rangeRef = useRef<ViewportRange>();
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
    [selected]
  );

  const drag = useCallback(() => undefined, []);
  const drop = useCallback(() => undefined, []);

  return {
    beginDrag,
    drag,
    drop,
  };
};
