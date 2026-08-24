import { DragEvent, DragEventHandler, useCallback } from "react";
import { GridLayoutDragEndHandler } from "./GridLayoutProvider";
import { useDragContext } from "./drag-drop-next/DragDropProviderNext";
import {
  DragSourceProvider,
  sourceIsComponent,
  sourceIsTemplate,
} from "./GridLayoutContext";
import { LayoutJSON } from "./componentToJson";

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
  getDragSource: DragSourceProvider;
  onDragEnd?: GridLayoutDragEndHandler;
  onDragStart?: GridLayoutDragStartHandler;
}

export const useDraggable = ({
  getDragSource,
  onDragEnd,
  onDragStart,
}: DraggableHookProps) => {
  const dragContext = useDragContext();

  const handleDragStart = useCallback<DragEventHandler<HTMLElement>>(
    (e) => {
      const dragSource = getDragSource(e);
      e.stopPropagation();
      // Note we're not currently using the dataTransfer object. We use the dragSource
      // We will need to change this if we want to support cross window drag drop
      if (sourceIsTemplate(dragSource)) {
        onDragStart?.(e, {
          payload: JSON.parse(dragSource.componentJson),
          type: "text/json",
        });
      } else if (sourceIsComponent(dragSource)) {
        onDragStart?.(e, { id: dragSource.id, type: "text/plain" });
      } else {
        throw Error("[useDraggable] unsupported drag source type");
      }

      dragContext.beginDrag(e.nativeEvent, dragSource);
    },
    [dragContext, getDragSource, onDragStart],
  );

  const handleDragEnd = useCallback<DragEventHandler<HTMLElement>>(
    (e) => {
      (e.target as HTMLElement).classList.remove("dragging");
      onDragEnd?.(e, dragContext.dropped);
      dragContext.endDrag();
    },
    [dragContext, onDragEnd],
  );

  return {
    onDragEnd: handleDragEnd,
    onDragStart: handleDragStart,
  };
};
