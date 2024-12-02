import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { initializeDragContainer } from "./drag-drop-listeners";
import {
  DragContext,
  type DragSources,
  type DropHandler,
  type IDragContext,
} from "./DragContextNext";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import dragDropProviderCss from "./DragDropProviderNext.css";

const unconfiguredRegistrationCall = () =>
  console.log(`have you forgotten to provide a DragDrop Provider ?`);

export type DragDropRegistrationFn = (id: string) => void;
export type DragDropBeginDrag = (
  id: string,
  draggedElement: HTMLElement,
) => void;
export type DragDropEndDrag = (id: string) => void;

export const isDraggable = (dragContext: IDragContext) =>
  dragContext.allowDrag === "local" || dragContext.allowDrag === "both";

const DragDropContext = createContext<IDragContext>({
  allowDrag: false,
  beginDrag: unconfiguredRegistrationCall,
  canDropHere: () => false,
  endDrag: unconfiguredRegistrationCall,
  dragState: { element: undefined, height: -1, sourceId: "", width: -1 },
  drop: unconfiguredRegistrationCall,
  dropped: false,
  isDraggable: false,
  isDragContainer: () => false,
  registerDragDropParty: unconfiguredRegistrationCall,
  withinDropZone: () => false,
});

export interface DragDropNextProviderProps {
  children: ReactNode;
  dragSources?: DragSources;
  local?: boolean;
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
  local,
  onDrop,
}: DragDropNextProviderProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-drag-drop-provider",
    css: dragDropProviderCss,
    window: targetWindow,
  });

  const dragContext = useMemo(
    () => new DragContext({ dragSources, local, onDrop }),
    [dragSources, local, onDrop],
  );

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
