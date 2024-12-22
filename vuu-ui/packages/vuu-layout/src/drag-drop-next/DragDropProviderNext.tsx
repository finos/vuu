import { createContext, ReactNode, useContext, useEffect } from "react";
import { initializeDragContainer } from "./drag-drop-listeners";
import {
  DragContext,
  type DragSources,
  type DropHandler,
} from "./DragContextNext";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import dragDropProviderCss from "./DragDropProviderNext.css";

export type DragDropRegistrationFn = (id: string) => void;
export type DragDropBeginDrag = (
  id: string,
  draggedElement: HTMLElement,
) => void;
export type DragDropEndDrag = (id: string) => void;

const DragDropContext = createContext<DragContext>(new DragContext());

export interface DragDropNextProviderProps {
  children: ReactNode;
  dragSources: DragSources;
  onDrop: DropHandler;
}

export type MeasuredTarget = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

export const DragDropProviderNext = ({
  children,
  dragSources,
  onDrop,
}: DragDropNextProviderProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-drag-drop-provider",
    css: dragDropProviderCss,
    window: targetWindow,
  });

  const dragContext = useDragContext();
  dragContext.dragSources = dragSources;
  // perhaps it should be an event emitter
  dragContext.dropHandler = onDrop;

  useEffect(() => {
    const cleanupCallbacks: Array<() => void> = [];
    if (dragSources) {
      Object.entries(dragSources).forEach(([id, { orientation }]) => {
        const el = document.getElementById(id);
        cleanupCallbacks.push(
          initializeDragContainer(el, dragContext, orientation),
        );
      });
      return () => cleanupCallbacks.forEach((cleanup) => cleanup());
    }
  }, [dragContext, dragSources]);

  return (
    <DragDropContext.Provider value={dragContext}>
      {children}
    </DragDropContext.Provider>
  );
};

export const useDragContext = () => {
  return useContext(DragDropContext);
};
