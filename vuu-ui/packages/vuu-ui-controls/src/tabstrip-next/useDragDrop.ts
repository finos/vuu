import {
  DragEventHandler,
  MouseEventHandler,
  useCallback,
  useRef,
} from "react";
import { DragDropState, IDragDropState, NullDragState } from "./DragDropState";
import {
  getElementDataIndex,
  orientationType,
  queryClosest,
} from "@finos/vuu-utils";
import { useDragDropNaturalMovement as useDragDropHook } from "./useDragDropNaturalMovement";
import { Direction, DropHandler } from "./dragDropTypes";

export interface DragDropHookProps {
  draggableQuery?: string;
  onDrop: DropHandler;
  orientation: orientationType;
}

export const useDragDrop = ({
  draggableQuery = ".vuuTab",
  onDrop: onDropProp,
  orientation = "horizontal",
}: DragDropHookProps) => {
  const dropTargetRef = useRef<HTMLElement | null>(null);
  const hoverTargetRef = useRef<HTMLElement | null>(null);
  const dragStateRef = useRef<IDragDropState>(NullDragState);

  const {
    startDrag,
    dragEnterDropContainer,
    dragEnterDropTarget,
    dragLeaveDropContainer,
    endDrag,
  } = useDragDropHook();

  const handleDrag = useCallback((e: DragEvent) => {
    const { current: dragState } = dragStateRef;
    dragState.x = e.clientX;
    dragState.y = e.clientY;
  }, []);

  const onEnterDragContainer = useCallback(() => {
    dragEnterDropContainer();
  }, [dragEnterDropContainer]);

  const onLeaveDragContainer = useCallback(() => {
    dragLeaveDropContainer();
  }, [dragLeaveDropContainer]);

  const onReverseDirection = useCallback(
    (direction: Direction) => {
      if (hoverTargetRef.current) {
        dragEnterDropTarget(hoverTargetRef.current, direction);
      }
    },
    [dragEnterDropTarget]
  );

  const onDragStart = useCallback<DragEventHandler>(
    (e) => {
      const draggedElement = queryClosest(e.target, draggableQuery);
      if (draggedElement) {
        const tabstrip = queryClosest(draggedElement, ".vuuTabstrip");
        tabstrip?.classList.add("dragging");

        startDrag(draggedElement);

        e.stopPropagation();

        const dolly = document.getElementById("dragImage") as HTMLElement;
        const dragState = (dragStateRef.current = new DragDropState({
          event: e,
          draggedElement,
          orientation,
          onEnterDragContainer,
          onLeaveDragContainer,
          onReverseDirection,
        }));

        dragState.x = e.clientX;
        dragState.y = e.clientY;

        e.dataTransfer.setData("text/plain", draggedElement.id);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setDragImage(
          dolly,
          dragState.mouseOffset.x,
          dragState.mouseOffset.y
        );

        addEventListener("drag", handleDrag);
      }
    },
    [
      draggableQuery,
      handleDrag,
      onEnterDragContainer,
      onLeaveDragContainer,
      onReverseDirection,
      orientation,
      startDrag,
    ]
  );

  const onDragEnd = useCallback<DragEventHandler>(() => {
    const { current: dragState } = dragStateRef;
    dragState.draggedElement?.classList.remove("dragging");
    dragStateRef.current = NullDragState;
  }, []);

  const onDragEnter = useCallback<DragEventHandler>(
    (e) => {
      const tabElement = queryClosest(e.target, ".vuuTab");
      if (tabElement) {
        const {
          current: { direction },
        } = dragStateRef;
        if (hoverTargetRef.current !== tabElement && direction) {
          hoverTargetRef.current = tabElement;
          dragEnterDropTarget(tabElement, direction);
        }
        e.stopPropagation();
      } else {
        const dropTargetElement = queryClosest(e.target, ".vuuDropTarget");
        if (dropTargetElement) {
          dropTargetRef.current = hoverTargetRef.current;
        }
      }
    },
    [dragEnterDropTarget]
  );
  const onDragOver = useCallback<DragEventHandler>((e) => {
    if ((e.target as HTMLElement)?.classList.contains("vuuDropTarget")) {
      e.preventDefault();
    }
  }, []);
  const onDrop = useCallback<DragEventHandler>(
    (e) => {
      e.stopPropagation();
      const { current: dropTarget } = dropTargetRef;
      const draggedElementId = e.dataTransfer.getData("text/plain");
      const draggedElement = document.getElementById(draggedElementId);
      if (draggedElement && dropTarget) {
        const fromIndex = getElementDataIndex(draggedElement);
        const toIndex = getElementDataIndex(dropTarget);
        endDrag(draggedElement);
        onDropProp({
          fromIndex,
          toIndex,
        });
      } else {
        throw Error("Drop: No valid dropTarget");
      }

      return false;
    },
    [endDrag, onDropProp]
  );

  const onMouseDown = useCallback<MouseEventHandler>((e) => {
    const tabElement = queryClosest(e.target, ".vuuTab");
    if (tabElement) {
      const dolly = document.getElementById("dragImage") as HTMLElement;
      const { height, width } = tabElement.getBoundingClientRect();
      dolly.innerHTML = tabElement.innerHTML;
      dolly.style.cssText = `position: absolute; left: 0px;height:${height}px;width:${width}px`;
    }
  }, []);

  return {
    onDragEnd,
    onDragEnter,
    onDragStart,
    onDragOver,
    onDrop,
    onMouseDown,
  };
};
