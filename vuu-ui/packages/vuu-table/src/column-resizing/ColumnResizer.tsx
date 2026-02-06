import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { RefCallback, useCallback, useRef } from "react";

import columnResizerCss from "./ColumnResizer.css";

const NOOP = () => undefined;

const baseClass = "vuuColumnResizer";
export interface TableColumnResizerProps {
  onDrag: (evt: MouseEvent, moveBy: number, totalDistanceMoved: number) => void;
  onDragEnd: (evt: MouseEvent, totalDistanceMoved: number) => void;
  /**
   *
   * @param evt DOM MouseEvent
   * @returns
   */
  onDragStart: (evt: MouseEvent) => void;
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
  const elementRef = useRef<HTMLDivElement | undefined>(undefined);

  const onPointerMove = useCallback(
    (e: MouseEvent) => {
      if (e.stopPropagation) {
        e.stopPropagation();
      }

      if (e.preventDefault) {
        e.preventDefault();
      }

      const { current: position } = positionRef;

      const x = e.clientX;
      const moveBy = Math.round(x - position.now);
      const distanceMoved = Math.round(x - position.start);

      positionRef.current.now = x;

      if (moveBy !== 0) {
        onDrag(e, moveBy, distanceMoved);
      }
    },
    [onDrag],
  );

  const onPointerUp = useCallback(
    (e: MouseEvent) => {
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onPointerMove);

      const { current: position } = positionRef;
      const distanceMoved = position.now - position.start;

      onDragEnd(e, distanceMoved);
    },
    [onDragEnd, onPointerMove],
  );

  const handlePointerDown = useCallback(
    (e: MouseEvent) => {
      const { current: position } = positionRef;
      onDragStart(e);
      position.now = position.start = e.clientX;
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointermove", onPointerMove);

      if (e.stopPropagation) {
        e.stopPropagation();
      }

      if (e.preventDefault) {
        e.preventDefault();
      }
    },
    [onDragStart, onPointerMove, onPointerUp],
  );

  const setRef = useCallback<RefCallback<HTMLDivElement>>(
    (el) => {
      if (el && elementRef.current === undefined) {
        el.addEventListener("pointerdown", handlePointerDown);
        elementRef.current = el;
      }
    },
    [handlePointerDown],
  );

  return <div className={baseClass} ref={setRef} role="separator" />;
};
