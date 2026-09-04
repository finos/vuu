import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
} from "react";
// import { initializeDragContainer } from "./drag-drop-listeners";
import {
  DragContext,
  type DragContextCancelTabDragHandler,
  type DragContextDetachTabHandler,
  type DragContextDropHandler,
  type DragSources,
} from "./DragContextNext";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import dragDropProviderCss from "./DragDropProviderNext.css";
import { useTemplateDragSession } from "./TemplateDragSession";

export type DragDropRegistrationFn = (id: string) => void;
export type DragDropBeginDrag = (
  id: string,
  draggedElement: HTMLElement,
) => void;
export type DragDropEndDrag = (id: string) => void;

export type DragSourceRegistrationHandler = (id: string) => void;

const DragDropContext = createContext<DragContext | undefined>(undefined);

export interface DragDropNextProviderProps {
  children: ReactNode;
  dragSources: DragSources;
  onCancelTabDrag: DragContextCancelTabDragHandler;
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
  onCancelTabDrag,
  onDetachTab,
  onDrop,
}: DragDropNextProviderProps) => {
  const targetWindow = useWindow();
  const templateDragSession = useTemplateDragSession();
  useComponentCssInjection({
    testId: "vuu-drag-drop-provider",
    css: dragDropProviderCss,
    window: targetWindow,
  });

  const dragContext = useMemo(
    () => new DragContext(templateDragSession),
    [templateDragSession],
  );

  useEffect(() => {
    if (!targetWindow) {
      return;
    }
    const cancelActiveDrag = () => {
      if (dragContext.ownsDrag) {
        dragContext.cancelDrag();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cancelActiveDrag();
      }
    };
    dragContext.on("cancel-tab-drag", onCancelTabDrag);
    dragContext.on("detach-tab", onDetachTab);
    dragContext.on("drop", onDrop);
    targetWindow.addEventListener("keydown", handleKeyDown);
    targetWindow.addEventListener("pointercancel", cancelActiveDrag);

    const cleanupCallbacks: Array<() => void> = [];
    // console.log(
    //   `[DragDropProviderNext#${layoutId}] useEffect dragSources [${[...dragContext.internalDragSources.keys()]}]`,
    // );
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
    return () => {
      dragContext.removeListener("cancel-tab-drag", onCancelTabDrag);
      dragContext.removeListener("detach-tab", onDetachTab);
      dragContext.removeListener("drop", onDrop);
      targetWindow.removeEventListener("keydown", handleKeyDown);
      targetWindow.removeEventListener("pointercancel", cancelActiveDrag);
      cancelActiveDrag();
      cleanupCallbacks.forEach((cleanup) => {
        cleanup();
      });
    };
  }, [dragContext, onCancelTabDrag, onDetachTab, onDrop, targetWindow]);

  return (
    <DragDropContext.Provider value={dragContext}>
      {children}
    </DragDropContext.Provider>
  );
};

export const useDragContext = () => {
  const dragContext = useContext(DragDropContext);
  if (!dragContext) {
    throw Error("[useDragContext] no DragDropProviderNext found");
  }
  return dragContext;
};
