import { DragEventHandler, useCallback, useMemo, useRef } from "react";
import {
  DragDropState,
  DragOrigin,
  IDragDropState,
  NullDragState,
} from "./DragDropState";
import {
  getElementDataIndex,
  orientationType,
  queryClosest,
  useDragContext,
} from "@finos/vuu-utils";
import { useDragDropNaturalMovement as useDragDropHook } from "./useDragDropNaturalMovement";
import { Direction, DropHandler } from "../hooks/dragDropTypes";

type HoverTargetState = {
  direction: Direction;
  // each time drag direction is reversed an out-by-one drop offset issue is incurred/removed
  applyDropOffset: boolean;
  target: HTMLElement;
};

const isDifferentTarget = (target: HTMLElement, state?: HoverTargetState) =>
  state !== undefined && state.target !== target;
const isDifferentDirection = (
  direction: Direction,
  state?: HoverTargetState,
): state is HoverTargetState =>
  state !== undefined && state.direction !== direction;

export interface DragDropHookProps {
  draggableQuery?: string;
  id: string;
  onDrop: DropHandler;
  orientation?: orientationType;
}

export const useDragDrop = ({
  draggableQuery = ".saltTabNext",
  id,
  onDrop: onDropProp,
  orientation = "horizontal",
}: DragDropHookProps) => {
  const hoverTargetStateRef = useRef<HoverTargetState | undefined>();
  const dragStateRef = useRef<IDragDropState>(NullDragState);
  const {
    startDrag,
    dragEnterDropContainer,
    dragEnterDropTarget,
    dragLeaveDropContainer,
    endDrag,
  } = useDragDropHook();
  const dragContext = useDragContext();

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

  const initiateDrag = useCallback(
    ({
      dragContainerElement,
      dragOrigin = "local",
      x,
      y,
    }: {
      dragContainerElement: HTMLElement;
      dragOrigin?: DragOrigin;
      x: number;
      y: number;
    }) => {
      dragContainerElement?.classList.add("vuuDragContainer-dragging");

      const dragState = (dragStateRef.current = new DragDropState({
        dragOrigin,
        dragContainerElement,
        orientation,
        onEnterDragContainer,
        onLeaveDragContainer,
      }));

      dragState.x = x;
      dragState.y = y;

      addEventListener("drag", handleDrag);
    },
    [handleDrag, onEnterDragContainer, onLeaveDragContainer, orientation],
  );

  const dragDropListeners = useMemo<DragDropListeners>(
    () => ({
      onDragEnd: () => {
        dragStateRef.current = NullDragState;
      },
      onDrop: (e) => {
        e.stopPropagation();
        const { current: hoverState } = hoverTargetStateRef;
        if (hoverState) {
          const dropTarget = hoverTargetStateRef.current?.target;
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
              toIndex: hoverState.applyDropOffset ? toIndex - 1 : toIndex,
            });
          }
          dragContext.endDrag(id);
        } else {
          throw Error("Drop: No valid dropTarget");
        }

        return false;
      },
      onDragEnter: (e) => {
        e.stopPropagation();

        const tabElement = queryClosest(e.target, draggableQuery);
        // const dragContainerElement = tabElement?.parentElement;
        // if (dragStateRef.current === NullDragState && dragContainerElement) {
        //   console.log(`we're seeing a dragged tab from another tabstrip`);
        //   initiateDrag({
        //     dragContainerElement,
        //     x: e.clientX,
        //     y: e.clientY,
        //   });

        //   dragStateRef.current.direction = "fwd";
        // }
        if (tabElement) {
          const {
            current: { direction = "fwd" },
          } = dragStateRef;
          const { current: hoverState } = hoverTargetStateRef;

          if (isDifferentTarget(tabElement, hoverState)) {
            hoverTargetStateRef.current = {
              applyDropOffset: hoverState?.applyDropOffset ?? false,
              target: tabElement,
              direction,
            };
            dragEnterDropTarget(
              tabElement,
              direction,
              dragContext.dragState.width,
            );
          } else if (isDifferentDirection(direction, hoverState)) {
            hoverState.applyDropOffset = !hoverState.applyDropOffset;
            hoverState.direction = direction;
            dragEnterDropTarget(
              tabElement,
              direction,
              dragContext.dragState.width,
            );
          }

          e.stopPropagation();
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
          e.stopPropagation();

          draggedElement.classList.add("vuuDragging");

          initiateDrag({
            dragContainerElement,
            x: e.clientX,
            y: e.clientY,
          });

          startDrag(draggedElement);

          hoverTargetStateRef.current = {
            applyDropOffset: false,
            // todo can we determine this more accurately
            direction: "fwd",
            target: draggedElement,
          };

          dragContext.beginDrag(id, draggedElement);

          e.dataTransfer.setData("text/plain", draggedElement.id);
          e.dataTransfer.effectAllowed = "move";
        }
      },
    }),
    [
      dragContext,
      dragEnterDropTarget,
      draggableQuery,
      endDrag,
      id,
      initiateDrag,
      onDropProp,
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
