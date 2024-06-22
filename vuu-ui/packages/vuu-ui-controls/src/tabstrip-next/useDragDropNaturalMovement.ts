import { useCallback, useRef } from "react";
import { useDragDisplacers } from "./useDragDisplacers";
import { Direction } from "./dragDropTypes";

export const useDragDropNaturalMovement = () => {
  const { clearSpacers, displaceItem } = useDragDisplacers();
  const sizeRef = useRef(0);

  const startDrag = useCallback(
    (draggedElement: HTMLElement) => {
      const { width: size } = draggedElement.getBoundingClientRect();
      sizeRef.current = size;

      requestAnimationFrame(() => {
        displaceItem(draggedElement, size, false, "static");
        draggedElement.classList.add("drag-away");
      });
    },
    [displaceItem]
  );

  const dragEnterDropTarget = useCallback(
    (dropTarget: HTMLElement, direction: Direction) => {
      displaceItem(dropTarget, sizeRef.current, true, direction);
    },
    [displaceItem]
  );

  const dragEnterDropContainer = useCallback(() => {
    console.log(`draggable has entered the arena`);
  }, []);
  const dragLeaveDropContainer = useCallback(() => {
    clearSpacers(true);
  }, [clearSpacers]);

  const endDrag = useCallback(
    (draggedElement: HTMLElement) => {
      clearSpacers();
      draggedElement.classList.remove("drag-away");
    },
    [clearSpacers]
  );

  return {
    dragEnterDropTarget,
    dragEnterDropContainer,
    dragLeaveDropContainer,
    endDrag,
    startDrag,
  };
};
