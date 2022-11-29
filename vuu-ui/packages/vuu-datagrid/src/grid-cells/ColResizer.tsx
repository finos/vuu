//TODO use useDrag
import React, { useCallback, useRef } from "react";

const NOOP = () => undefined;

export interface ColResizerProps {
  onDrag: (evt: MouseEvent, moveBy: number) => void;
  onDragEnd: (evt: MouseEvent) => void;
  onDragStart: (evt: React.MouseEvent) => void;
}

export const ColResizer = (allProps: ColResizerProps) => {
  const { onDrag, onDragEnd = NOOP, onDragStart = NOOP, ...props } = allProps;

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

  return (
    <div className="resizeHandle" onMouseDown={handleMouseDown} {...props} />
  );
};
