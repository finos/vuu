import { useCallback, useRef } from "react";
import { useResizeObserver } from "./utils";
import { ROW_HEIGHT } from "./grid-model/gridModelActions";
import { useGridContext } from "./grid-context";

const dimensions = ["height"];

export const useRowHeight = () => {
  const { dispatchGridModelAction } = useGridContext();
  const ref = useRef<HTMLDivElement>(null);

  const onResize = useCallback(
    ({ height }) => {
      dispatchGridModelAction?.({ type: ROW_HEIGHT, rowHeight: height });
    },
    [dispatchGridModelAction]
  );

  useResizeObserver(ref, dimensions, onResize);

  return ref;
};
