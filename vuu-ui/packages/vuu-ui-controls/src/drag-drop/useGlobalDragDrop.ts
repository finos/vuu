import { useCallback, useRef } from "react";
import { MouseOffset } from "./dragDropTypesNext";

export const useGlobalDragDrop = () => {
  // A ref to the draggable element
  const draggableRef = useRef<HTMLElement | null>(null);
  /** current mouse position */
  const mousePosRef = useRef<MouseOffset>({ x: 0, y: 0 });
  /** Distance between start (top | left) of dragged element and point where user pressed to drag */
  const mouseOffsetRef = useRef<MouseOffset>({ x: 0, y: 0 });

  const dragMouseMoveHandler = useCallback(
    (evt: MouseEvent) => {
      const { clientX, clientY } = evt;

      mousePosRef.current.x = clientX;
      mousePosRef.current.y = clientY;

      if (draggableRef.current) {
        const dragPosX = mousePosRef.current.x - mouseOffsetRef.current.x;
        const dragPosY = mousePosRef.current.y - mouseOffsetRef.current.y;
        draggableRef.current.style.top = `${dragPosY}px`;
        draggableRef.current.style.left = `${dragPosX}px`;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const dragMouseUpHandler = useCallback(
    (evt: MouseEvent) => {
      document.removeEventListener("mousemove", dragMouseMoveHandler, false);
      document.removeEventListener("mouseup", dragMouseUpHandler, false);
    },
    [dragMouseMoveHandler]
  );

  const resumeDrag = useCallback(
    (draggedElement: HTMLElement, mouseOffset?: MouseOffset) => {
      console.log(`resume drag of `, {
        draggedElement,
      });
      draggableRef.current = draggedElement;
      if (mouseOffset) {
        mouseOffsetRef.current = mouseOffset;
      }
      document.addEventListener("mousemove", dragMouseMoveHandler, false);
      document.addEventListener("mouseup", dragMouseUpHandler, false);

      // identify and measure drop targets
    },
    [dragMouseMoveHandler, dragMouseUpHandler]
  );

  return {
    resumeDrag,
  };
};
