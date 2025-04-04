import { DragEvent, DragEventHandler, useCallback } from "react";
import { GridLayoutDragEndHandler } from "./GridLayoutProvider";
import { useDragContext } from "./drag-drop-next/DragDropProviderNext";
import {
  DragSourceProvider,
  sourceIsComponent,
  sourceIsTemplate,
  useGridLayoutId,
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
  const layoutId = useGridLayoutId();

  const handleDragStart = useCallback<DragEventHandler<HTMLElement>>(
    (e) => {
      const dragSource = getDragSource(e);
      e.stopPropagation();
      // Note we're not currently using the dataTransfer object. We use the dragSource
      // We will need to change this if we want to support cross window drag drop
      if (sourceIsTemplate(dragSource)) {
        console.log(`[useDraggable#${layoutId}] drag template`);
        onDragStart?.(e, {
          payload: JSON.parse(dragSource.componentJson),
          type: "text/json",
        });
      } else if (sourceIsComponent(dragSource)) {
        console.log(`[useDraggable#${layoutId}] drag component`);
        onDragStart?.(e, { id: dragSource.id, type: "text/plain" });
      } else {
        throw Error("didnt expect this");
      }

      dragContext.beginDrag(e.nativeEvent, dragSource);
    },
    [dragContext, getDragSource, layoutId, onDragStart],
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
