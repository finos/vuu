import { Heading, KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { RefObject, useCallback, useRef } from "react";

export type ResizeHandler = (evt: MouseEvent, moveBy: number) => void;
export interface CellResizeHookProps {
  column: KeyedColumnDescriptor | Heading;
  onResize?: (phase: resizePhase, columnName: string, width?: number) => void;
  rootRef: RefObject<HTMLDivElement>;
}

type resizePhase = "begin" | "resize" | "end";

export interface CellResizeHookResult {
  isResizing: boolean;
  onDrag: (evt: MouseEvent, moveBy: number) => void;
  onDragStart: (evt: React.MouseEvent) => void;
  onDragEnd: (evt: MouseEvent) => void;
}

export const useTableColumnResize = ({
  column,
  onResize,
  rootRef,
}: CellResizeHookProps): CellResizeHookResult => {
  const widthRef = useRef(0);
  const isResizing = useRef(false);
  const { name } = column;

  const handleResizeStart = useCallback(() => {
    if (onResize && rootRef.current) {
      const { width } = rootRef.current.getBoundingClientRect();
      widthRef.current = Math.round(width);
      isResizing.current = true;
      onResize?.("begin", name);
    }
  }, [name, onResize, rootRef]);

  const handleResize = useCallback(
    (_evt: MouseEvent, moveBy: number) => {
      if (rootRef.current) {
        if (onResize) {
          const { width } = rootRef.current.getBoundingClientRect();
          const newWidth = Math.round(width) + moveBy;
          if (newWidth !== widthRef.current && newWidth > 0) {
            onResize("resize", name, newWidth);
            widthRef.current = newWidth;
          }
        }
      }
    },
    [name, onResize, rootRef]
  );

  const handleResizeEnd = useCallback(() => {
    if (onResize) {
      onResize("end", name, widthRef.current);
      isResizing.current = false;
    }
  }, [name, onResize]);

  return {
    isResizing: isResizing.current,
    onDrag: handleResize,
    onDragStart: handleResizeStart,
    onDragEnd: handleResizeEnd,
  };
};
