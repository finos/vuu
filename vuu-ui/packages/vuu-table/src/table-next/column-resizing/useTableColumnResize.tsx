import { Heading, RuntimeColumnDescriptor } from "@finos/vuu-datagrid-types";
import { RefObject, useCallback, useRef, useState } from "react";
import { ResizePhase } from "../useTableModel";

export type TableColumnResizeHandler = (
  phase: ResizePhase,
  columnName: string,
  width?: number
) => void;

export type ResizeHandler = (evt: MouseEvent, moveBy: number) => void;
export interface CellResizeHookProps {
  column: RuntimeColumnDescriptor | Heading;
  onResize?: (phase: ResizePhase, columnName: string, width?: number) => void;
  rootRef: RefObject<HTMLDivElement>;
}

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
  const [isResizing, setResizing] = useState(false);
  const { name } = column;

  const handleResizeStart = useCallback(() => {
    console.log("onResizeStart");

    if (onResize && rootRef.current) {
      console.log("handleResizeStart");
      const { width } = rootRef.current.getBoundingClientRect();
      widthRef.current = Math.round(width);
      setResizing(true);
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
      setTimeout(() => {
        // clickHandler in HeaderCell checks isResizing before firing. Because onMouseUp
        // fires before click, we need to delay setting isResizing back to false, just
        // long enough that the click ghandler will have fired.
        setResizing(false);
      }, 80);
    }
  }, [name, onResize]);

  return {
    isResizing,
    onDrag: handleResize,
    onDragStart: handleResizeStart,
    onDragEnd: handleResizeEnd,
  };
};
