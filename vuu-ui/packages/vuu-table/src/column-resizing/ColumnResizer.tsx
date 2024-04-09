import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { useCallback, useRef } from "react";

import columnResizerCss from "./ColumnResizer.css";

const NOOP = () => undefined;

const baseClass = "vuuColumnResizer";
export interface TableColumnResizerProps {
  onDrag: (evt: MouseEvent, moveBy: number, totalDistanceMoved: number) => void;
  onDragEnd: (evt: MouseEvent, totalDistanceMoved: number) => void;
  onDragStart: (evt: React.MouseEvent) => void;
}

export const ColumnResizer = ({
  onDrag,
  onDragEnd = NOOP,
  onDragStart = NOOP,
}: TableColumnResizerProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-column-resizer",
    css: columnResizerCss,
    window: targetWindow,
  });

  const positionRef = useRef({ start: 0, now: 0 });

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (e.stopPropagation) {
        e.stopPropagation();
      }

      if (e.preventDefault) {
        e.preventDefault();
      }

      const { current: position } = positionRef;

      const x = Math.round(e.clientX);
      const moveBy = x - position.now;
      const distanceMoved = position.now - position.start;

      positionRef.current.now = x;

      if (moveBy !== 0) {
        onDrag(e, moveBy, distanceMoved);
      }
    },
    [onDrag]
  );

  const onMouseUp = useCallback(
    (e: MouseEvent) => {
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);

      const { current: position } = positionRef;
      const distanceMoved = position.now - position.start;
      onDragEnd(e, distanceMoved);
    },
    [onDragEnd, onMouseMove]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const { current: position } = positionRef;
      onDragStart(e);
      position.now = position.start = Math.round(e.clientX);

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
