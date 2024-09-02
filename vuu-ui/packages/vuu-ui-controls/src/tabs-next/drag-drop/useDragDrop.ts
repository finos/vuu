import { DragEventHandler, useCallback, useMemo, useRef } from "react";
import { DragDropState, IDragDropState, NullDragState } from "./DragDropState";
import {
  getElementDataIndex,
  orientationType,
  queryClosest,
} from "@finos/vuu-utils";
import { useDragDropNaturalMovement as useDragDropHook } from "./useDragDropNaturalMovement";
import { Direction, DropHandler } from "../hooks/dragDropTypes";

export interface DragDropHookProps {
  draggableQuery?: string;
  onDrop: DropHandler;
  orientation?: orientationType;
}

export const useDragDrop = ({
  draggableQuery = ".saltTabNext",
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
    [dragEnterDropTarget],
  );

  const dragDropListeners = useMemo<DragDropListeners>(
    () => ({
      onDragEnd: () => {
        dragStateRef.current = NullDragState;
      },
      onDrop: (e) => {
        e.stopPropagation();
        const { current: dropTarget } = dropTargetRef;
        const draggedElementId = e.dataTransfer.getData("text/plain");
        const draggedElement = document.getElementById(draggedElementId);

        if (draggedElement && dropTarget) {
          draggedElement.classList.remove("vuuDragging");
          draggedElement.parentElement?.classList.remove(
            "vuuDragContainer-dragging",
          );

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
      onDragEnter: (e) => {
        console.log("onDragEnter");
        e.stopPropagation();

        const tabElement = queryClosest(e.target, draggableQuery);
        if (dragStateRef.current === NullDragState) {
          console.log(`we're saeeing a dragged tab from another tabstrip`);
        }
        // const tabContainer = tabElement?.parentElement;
        if (tabElement) {
          // console.log({ dragDropState: dragStateRef.current });
          // if (tabContainer !== dragStateRef.current.dragContainerElement) {
          //   // TODO need to decide how we determine of this is allowed
          //   dragStateRef.current.dragContainerElement = tabContainer;
          // }

          const {
            current: { direction },
          } = dragStateRef;
          if (hoverTargetRef.current !== tabElement && direction) {
            hoverTargetRef.current = tabElement;
            dragEnterDropTarget(tabElement, direction);
          }
          e.stopPropagation();
        } else {
          const dropTargetElement = queryClosest(
            e.target,
            ".vuuDraggable-spacer",
          );
          if (dropTargetElement) {
            dropTargetRef.current = hoverTargetRef.current;
          }
        }
      },
      onDragOver: (e) => {
        if (
          (e.target as HTMLElement)?.classList.contains("vuuDraggable-spacer")
        ) {
          e.preventDefault();
        }
      },
      onDragStart: (e) => {
        console.log("onDragStart");
        const draggedElement = queryClosest(e.target, draggableQuery);
        const dragContainerElement = draggedElement?.parentElement;
        if (draggedElement && dragContainerElement) {
          draggedElement.classList.add("vuuDragging");
          dragContainerElement?.classList.add("vuuDragContainer-dragging");

          startDrag(draggedElement);

          e.stopPropagation();

          const dragState = (dragStateRef.current = new DragDropState({
            event: e,
            draggedElement,
            dragContainerElement,
            orientation,
            onEnterDragContainer,
            onLeaveDragContainer,
            onReverseDirection,
          }));

          dragState.x = e.clientX;
          dragState.y = e.clientY;

          e.dataTransfer.setData("text/plain", draggedElement.id);
          e.dataTransfer.effectAllowed = "move";

          addEventListener("drag", handleDrag);
        }
      },
    }),
    [
      dragEnterDropTarget,
      draggableQuery,
      endDrag,
      handleDrag,
      onDropProp,
      onEnterDragContainer,
      onLeaveDragContainer,
      onReverseDirection,
      orientation,
      startDrag,
    ],
  );

  return dragDropListeners;
};

type DragDropListeners = {
  onDragEnd: DragEventHandler;
  onDragEnter: DragEventHandler;
  onDragStart: DragEventHandler;
  onDragOver: DragEventHandler;
  onDrop: DragEventHandler;
};
