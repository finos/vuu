import { createContext, ReactNode, useContext, useEffect } from "react";
// import { initializeDragContainer } from "./drag-drop-listeners";
import {
  DragContext,
  DragContextDetachTabHandler,
  DragContextDropHandler,
  type DragSources,
} from "./DragContextNext";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import dragDropProviderCss from "./DragDropProviderNext.css";
import { useGridLayoutId } from "../GridLayoutContext";

export type DragDropRegistrationFn = (id: string) => void;
export type DragDropBeginDrag = (
  id: string,
  draggedElement: HTMLElement,
) => void;
export type DragDropEndDrag = (id: string) => void;

export type DragSourceRegistrationHandler = (id: string) => void;

const DragDropContext = createContext<DragContext>(new DragContext());

export interface DragDropNextProviderProps {
  children: ReactNode;
  dragSources: DragSources;
  onDetachTab: DragContextDetachTabHandler;
  onDrop: DragContextDropHandler;
}

export type MeasuredTarget = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

export const DragDropProviderNext = ({
  children,
  onDetachTab,
  onDrop,
}: DragDropNextProviderProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-drag-drop-provider",
    css: dragDropProviderCss,
    window: targetWindow,
  });

  const dragContext = useDragContext();

  const layoutId = useGridLayoutId();

  useEffect(() => {
    dragContext.on("detach-tab", onDetachTab);
    dragContext.on("drop", onDrop);

    const cleanupCallbacks: Array<() => void> = [];
    console.log(
      `[DragDropProviderNext#${layoutId}] useEffect dragSources [${[...dragContext.internalDragSources.keys()]}]`,
    );
    // TODO this is for declarative drag drop sources, not supported for now
    // dragContext.internalDragSources.forEach(({ orientation }, id) => {
    //   const el = document.getElementById(id);
    //   if (el) {
    //     cleanupCallbacks.push(
    //       initializeDragContainer(el, dragContext, orientation),
    //     );
    //   } else {
    //     throw Error(
    //       `[DragDropProviderNext] useEffect no element found for dragSource #${id}`,
    //     );
    //   }
    // });
    return () => cleanupCallbacks.forEach((cleanup) => cleanup());
  }, [dragContext, layoutId, onDetachTab, onDrop]);

  return (
    <DragDropContext.Provider value={dragContext}>
      {children}
    </DragDropContext.Provider>
  );
};

export const useDragContext = () => {
  return useContext(DragDropContext);
};
