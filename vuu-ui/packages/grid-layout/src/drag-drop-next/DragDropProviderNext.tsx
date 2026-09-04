import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  onCancelDrag?: () => void;
  onCancelTabDrag: DragContextCancelTabDragHandler;
  onDetachTab: DragContextDetachTabHandler;
  onDrop: DragContextDropHandler;
}

const NOOP = () => undefined;

export type MeasuredTarget = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

export const DragDropProviderNext = ({
  children,
  onCancelDrag = NOOP,
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
  const handlersRef = useRef({
    onCancelDrag,
    onCancelTabDrag,
    onDetachTab,
    onDrop,
  });
  handlersRef.current = {
    onCancelDrag,
    onCancelTabDrag,
    onDetachTab,
    onDrop,
  };

  useEffect(() => {
    if (!targetWindow) {
      return;
    }
    const cancelActiveDrag = () => {
      handlersRef.current.onCancelDrag();
      if (dragContext.ownsDrag) {
        dragContext.cancelDrag();
      } else {
        dragContext.cleanupDragState();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cancelActiveDrag();
      }
    };
    const handleCancelTabDrag: DragContextCancelTabDragHandler = (event) =>
      handlersRef.current.onCancelTabDrag(event);
    const handleDetachTab: DragContextDetachTabHandler = (event) =>
      handlersRef.current.onDetachTab(event);
    const handleDrop: DragContextDropHandler = (event) =>
      handlersRef.current.onDrop(event);
    dragContext.on("cancel-tab-drag", handleCancelTabDrag);
    dragContext.on("detach-tab", handleDetachTab);
    dragContext.on("drop", handleDrop);
    targetWindow.addEventListener("keydown", handleKeyDown);
    targetWindow.addEventListener("dragend", cancelActiveDrag);
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
      dragContext.removeListener("cancel-tab-drag", handleCancelTabDrag);
      dragContext.removeListener("detach-tab", handleDetachTab);
      dragContext.removeListener("drop", handleDrop);
      targetWindow.removeEventListener("keydown", handleKeyDown);
      targetWindow.removeEventListener("dragend", cancelActiveDrag);
      targetWindow.removeEventListener("pointercancel", cancelActiveDrag);
      cancelActiveDrag();
      cleanupCallbacks.forEach((cleanup) => {
        cleanup();
      });
    };
  }, [dragContext, targetWindow]);

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
