import { useCallback, useMemo } from "react";
import { dropZone, MeasuredDropTarget } from "./dragUtils";
import { createDropIndicatorPosition } from "./Draggable";

export const SPACER_SIZE = 0;

export type DropIndicatorHookResult = {
  positionDropIndicator: (
    dropTarget: MeasuredDropTarget,
    dropZone: dropZone
  ) => HTMLElement;
  clearSpacer: () => void;
};

export type DropIndicatorHook = () => DropIndicatorHookResult;

export const useDropIndicator: DropIndicatorHook = () => {
  const spacer = useMemo(() => createDropIndicatorPosition(), []);
  const clearSpacer = useCallback(() => spacer.remove(), [spacer]);
  const positionDropIndicator = useCallback(
    (dropTarget: MeasuredDropTarget, dropZone: "start" | "end" = "end") => {
      if (dropZone === "end") {
        dropTarget.element.after(spacer);
      } else {
        dropTarget.element.before(spacer);
      }
      return spacer;
    },
    [spacer]
  );

  return {
    positionDropIndicator,
    clearSpacer,
  };
};
