// export interface ColumnResizerProps {}
import { useCallback, useRef } from "react";
import "./ColumnResizer.css";

const NOOP = () => undefined;

const baseClass = "vuuColumnResizer";
export interface TableColumnResizerProps {
  onDrag: (evt: MouseEvent, moveBy: number) => void;
  onDragEnd: (evt: MouseEvent) => void;
  onDragStart: (evt: React.MouseEvent) => void;
}

export const ColumnResizer = ({
  onDrag,
  onDragEnd = NOOP,
  onDragStart = NOOP,
}: TableColumnResizerProps) => {
  const position = useRef(0);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (e.stopPropagation) {
        e.stopPropagation();
      }

      if (e.preventDefault) {
        e.preventDefault();
      }

      const x = Math.round(e.clientX);
      const moveBy = x - position.current;
      position.current = x;

      if (moveBy !== 0) {
        onDrag(e, moveBy);
      }
    },
    [onDrag]
  );

  const onMouseUp = useCallback(
    (e: MouseEvent) => {
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      onDragEnd(e);
    },
    [onDragEnd, onMouseMove]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      onDragStart(e);

      position.current = Math.round(e.clientX);

      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("mousemove", onMouseMove);

      if (e.stopPropagation) {
        e.stopPropagation();
      }

      if (e.preventDefault) {
        e.preventDefault();
      }
    },
    [onDragStart, onMouseMove, onMouseUp]
  );

  return <div className={baseClass} onMouseDown={handleMouseDown} />;
};
