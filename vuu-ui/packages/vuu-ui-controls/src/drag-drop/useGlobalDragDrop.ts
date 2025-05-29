import { boxContainsPoint, dispatchCustomEvent } from "@vuu-ui/vuu-utils";
import { useCallback, useRef } from "react";
import { MeasuredTarget } from "./DragDropProvider";
import { DragDropState } from "./DragDropState";
import { MouseOffset } from "./dragDropTypes";

export type ResumeDragHandler = (dragDropState: DragDropState) => boolean;
export type GlobalDropHandler = (dragDropState: DragDropState) => void;

export const useGlobalDragDrop = ({
  onDragOverDropTarget,
  onDrop,
}: {
  onDragOverDropTarget: (
    dropTargetId: string,
    dragDropState: DragDropState,
  ) => boolean;
  onDrop: (dropTargetId: string, dragDropState: DragDropState) => void;
}) => {
  const dropTargetRef = useRef<string>();
  const measuredDropTargetsRef = useRef<Record<string, MeasuredTarget>>();

  const dragDropStateRef = useRef<DragDropState | null>(null);
  /** current mouse position */
  const mousePosRef = useRef<MouseOffset>({ x: 0, y: 0 });

  const overDropTarget = useCallback((x: number, y: number) => {
    const { current: dropTargets } = measuredDropTargetsRef;
    if (dropTargets) {
      for (const [id, measuredTarget] of Object.entries(dropTargets)) {
        if (boxContainsPoint(measuredTarget, x, y)) {
          return id;
        }
      }
    }
    return undefined;
  }, []);

  const dragMouseMoveHandler = useCallback(
    (evt: MouseEvent) => {
      const { clientX, clientY } = evt;
      const { current: dragDropState } = dragDropStateRef;

      mousePosRef.current.x = clientX;
      mousePosRef.current.y = clientY;

      if (dragDropState?.draggableElement) {
        const { draggableElement, mouseOffset } = dragDropState;

        const dragPosX = mousePosRef.current.x - mouseOffset.x;
        const dragPosY = mousePosRef.current.y - mouseOffset.y;
        draggableElement.style.top = `${dragPosY}px`;
        draggableElement.style.left = `${dragPosX}px`;

        const dropTargetId = overDropTarget(dragPosX, dragPosY);
        if (dropTargetId) {
          const dropTargetWillResumeDrag = onDragOverDropTarget(
            dropTargetId,
            dragDropState,
          );
          if (dropTargetWillResumeDrag) {
            // prettier-ignore
            document.removeEventListener("mousemove", dragMouseMoveHandler, false);
            document.removeEventListener("mouseup", dragMouseUpHandler, false);
            dragDropStateRef.current = null;
            dropTargetRef.current = undefined;
          } else {
            dropTargetRef.current = dropTargetId;
          }
        } else {
          dropTargetRef.current = undefined;
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const dragMouseUpHandler = useCallback(() => {
    document.removeEventListener("mousemove", dragMouseMoveHandler, false);
    document.removeEventListener("mouseup", dragMouseUpHandler, false);
    const { current: dragDropState } = dragDropStateRef;
    if (dragDropState) {
      dragDropStateRef.current = null;
      if (dropTargetRef.current) {
        onDrop(dropTargetRef.current, dragDropState);
      }
      if (dragDropState.draggableElement) {
        dispatchCustomEvent(dragDropState.draggableElement, "vuu-dropped");
      }
    }
  }, [dragMouseMoveHandler, onDrop]);

  const resumeDrag = useCallback<ResumeDragHandler>(
    (dragDropState) => {
      dragDropStateRef.current = dragDropState;
      document.addEventListener("mousemove", dragMouseMoveHandler, false);
      document.addEventListener("mouseup", dragMouseUpHandler, false);

      return true;
    },
    [dragMouseMoveHandler, dragMouseUpHandler],
  );

  return {
    measuredDropTargetsRef,
    resumeDrag,
  };
};
