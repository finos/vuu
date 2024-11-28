import { createContext, ReactNode, useContext, useMemo } from "react";

const unconfiguredRegistrationCall = () =>
  console.log(`have you forgotten to provide a DragDrop Provider ?`);

export type DragDropNextRegistrationFn = (id: string) => void;
export type DragDropNextBeginDrag = (
  id: string,
  draggedElement: HTMLElement,
) => void;
export type DragDropNextEndDrag = (id: string) => void;

export interface IDragContext {
  beginDrag: (id: string, element: HTMLElement) => void;
  dragState: { element?: HTMLElement; height?: number; width?: number };
  endDrag: (id: string) => void;
  registerDragDropParty: (id: string) => void;
}

export class DragContext implements IDragContext {
  #element?: HTMLElement;
  #height?: number;
  #width?: number;
  beginDrag(id: string, element: HTMLElement) {
    console.log(`[DragContext] beginDrag #${id}`);
    const { height, width } = element.getBoundingClientRect();
    this.#element = element;
    this.#height = height;
    this.#width = width;
  }

  endDrag(id: string) {
    console.log(`[DragContext] end drag #${id}`);
    this.#element = undefined;
    this.#height = undefined;
    this.#width = undefined;
  }

  registerDragDropParty(id: string) {
    console.log(`register dragdrop party ${id}`);
  }

  get dragState() {
    return {
      element: this.#element,
      height: this.#height,
      width: this.#width,
    };
  }
}

const DragDropNextContext = createContext<IDragContext>({
  beginDrag: unconfiguredRegistrationCall,
  endDrag: unconfiguredRegistrationCall,
  dragState: { element: undefined, height: -1, width: -1 },
  registerDragDropParty: unconfiguredRegistrationCall,
});

export interface DragDropNextProviderProps {
  children: ReactNode;
}

export type MeasuredTarget = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

export const DragDropProviderNext = ({
  children,
}: DragDropNextProviderProps) => {
  const contextValue = useMemo(() => new DragContext(), []);

  return (
    <DragDropNextContext.Provider value={contextValue}>
      {children}
    </DragDropNextContext.Provider>
  );
};

export const useDragContext = () => {
  return useContext(DragDropNextContext);
};
