import { DragEvent, DragEventHandler, useCallback } from "react";
import { GridLayoutDragEndHandler } from "./GridLayoutProvider";
import { LayoutJSON } from "@finos/vuu-utils";
import { useDragContext } from "../drag-drop-next/DragDropProviderNext";
import { DragSource } from "../drag-drop-next/DragContextNext";

export type DragStartIdOptions = {
  id: string;
  type: "text/plain";
};
export type DragStartJsonOptions = {
  payload: LayoutJSON;
  type: "text/json";
};

export type GridLayoutDragStartHandler = (
  evt: DragEvent<HTMLElement>,
  dragStartOptions: DragStartIdOptions | DragStartJsonOptions,
) => void;

export interface DraggableHookProps {
  draggableClassName?: string;
  getDragSource: (evt: DragEvent<Element>) => DragSource;
  onDragEnd?: GridLayoutDragEndHandler;
  onDragStart?: GridLayoutDragStartHandler;
}

export const useDraggable = ({
  getDragSource: getDragSourceWithElement,
  onDragEnd,
  onDragStart,
}: DraggableHookProps) => {
  const dragContext = useDragContext();

  const handleDragStart = useCallback<DragEventHandler<HTMLElement>>(
    (e) => {
      const dragSource = getDragSourceWithElement(e);
      e.stopPropagation();

      if (dragSource.type === "template") {
        onDragStart?.(e, {
          payload: JSON.parse(dragSource.componentJson),
          type: "text/json",
        });
      } else {
        onDragStart?.(e, { id: dragSource.id, type: "text/plain" });
      }

      dragContext.beginDrag(e.nativeEvent, dragSource);
    },
    [dragContext, getDragSourceWithElement, onDragStart],
  );

  const handleDragEnd = useCallback<DragEventHandler<HTMLElement>>(
    (e) => {
      (e.target as HTMLElement).classList.remove("dragging");
      onDragEnd?.(e);
    },
    [onDragEnd],
  );

  return {
    onDragEnd: handleDragEnd,
    onDragStart: handleDragStart,
  };
};
