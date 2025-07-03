import {
  ColumnDescriptor,
  Heading,
  ResizePhase,
} from "@vuu-ui/vuu-table-types";
import { RefObject, useCallback, useRef, useState } from "react";

export type ResizeHandler = (evt: MouseEvent, moveBy: number) => void;
export interface CellResizeHookProps {
  column: ColumnDescriptor | Heading;
  onResize?: (phase: ResizePhase, columnName: string, width?: number) => void;
  rootRef: RefObject<HTMLDivElement | null>;
}

export interface CellResizeHookResult {
  isResizing: boolean;
  onDrag: (evt: MouseEvent, moveBy: number, totalDistanceMoved: number) => void;
  onDragStart: (evt: MouseEvent) => void;
  onDragEnd: (evt: MouseEvent) => void;
}

export const useTableColumnResize = ({
  column,
  onResize,
  rootRef,
}: CellResizeHookProps): CellResizeHookResult => {
  const widthRef = useRef({ start: 0, now: 0 });

  const [isResizing, setResizing] = useState(false);
  const { name } = column;

  const handleResizeStart = useCallback(() => {
    if (onResize && rootRef.current) {
      const { current: width } = widthRef;
      const { width: measuredWidth } = rootRef.current.getBoundingClientRect();
      width.start = width.now = Math.round(measuredWidth);
      setResizing(true);
      onResize?.("begin", name);
    }
  }, [name, onResize, rootRef]);

  const handleResize = useCallback(
    (_evt: MouseEvent, moveBy: number, totalDistanceMoved: number) => {
      if (rootRef.current) {
        if (onResize) {
          const { current: width } = widthRef;
          const newWidth = width.start + totalDistanceMoved;
          if (newWidth !== width.now && newWidth > 0) {
            onResize("resize", name, newWidth);
            width.now = newWidth;
          }
        }
      }
    },
    [name, onResize, rootRef],
  );

  const handleResizeEnd = useCallback(() => {
    if (onResize) {
      const { current: width } = widthRef;
      onResize("end", name, width.now);
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
