import { DragSources } from "@finos/vuu-ui-controls";
import { createContext, ReactNode, useContext, useMemo } from "react";

const unconfiguredRegistrationCall = () =>
  console.log(`have you forgotten to provide a DragDrop Provider ?`);

export type DragDropNextRegistrationFn = (id: string) => void;
export type DragDropNextBeginDrag = (
  id: string,
  draggedElement: HTMLElement,
) => void;
export type DragDropNextEndDrag = (id: string) => void;

export type DragNextSources = {
  [key: string]: { dropTargets: string | string[]; payloadType?: string };
};

export interface IDragContext {
  allowDrag: false | "local" | "remote" | "both";
  beginDrag: (id: string, element: HTMLElement) => void;
  draggedElement?: HTMLElement;
  dragSources?: DragNextSources;
  dragState?: {
    element: HTMLElement;
    height: number;
    sourceId: string;
    width: number;
  };
  drop: DropHandler;
  endDrag: (id: string) => void;
  isDraggable: boolean;
  isDragContainer: (id: string) => boolean;
  registerDragDropParty: (id: string) => void;
}

type DragContextConstructorProps = {
  dragSources?: DragNextSources;
  local?: boolean;
  onDrop: DropHandler;
};

// this will be expanded
export type DropHandler = (
  id: string,
  fromIndex: number,
  toIndex: number,
) => void;

export class DragContext implements IDragContext {
  #dragSourceId?: string;
  #dragSources?: Map<string, string[]>;
  #dropHandler: DropHandler;
  #element?: HTMLElement;
  #height?: number;
  #isLocal?: boolean;
  #width?: number;
  constructor({
    dragSources,
    local = true,
    onDrop,
  }: DragContextConstructorProps) {
    this.#dropHandler = onDrop;
    this.#isLocal = local;
    if (dragSources) {
      this.#dragSources = this.buildDragSources(dragSources);
    }
  }
  beginDrag(id: string, element: HTMLElement) {
    const { height, width } = element.getBoundingClientRect();
    this.#dragSourceId = id;
    this.#element = element;
    this.#height = height;
    this.#width = width;
  }

  endDrag(id: string) {
    console.log(`[DragContext] end drag #${id}`);
    this.#dragSourceId = undefined;
    this.#element = undefined;
    this.#height = undefined;
    this.#width = undefined;
  }

  drop = (id: string, fromIndex: number, toIndex: number) => {
    this.#dropHandler(id, fromIndex, toIndex);
  };

  registerDragDropParty(id: string) {
    console.log(`register dragdrop party ${id}`);
  }

  get allowDrag() {
    return this.#isLocal ? "local" : false;
  }

  get draggedElement() {
    const element = this.#element;
    if (element) {
      return element;
    } else {
      throw Error(
        `dragged element is being accessed, but drag is not in effect, of beginDrag was not called`,
      );
    }
  }

  get dragState() {
    const element = this.#element;
    const height = this.#height;
    const sourceId = this.#dragSourceId;
    const width = this.#width;
    if (element && height !== undefined && sourceId && width !== undefined) {
      return {
        element,
        height,
        sourceId,
        width,
      };
    }
  }

  get isDraggable() {
    return this.allowDrag === "local";
  }

  private isDragSource(id: string) {
    return this.#dragSources?.has(id) ?? false;
  }

  isDragContainer = (id: string) => {
    return this.allowDrag === "local" || this.isDragSource(id);
  };

  private buildDragSources(dragSources: DragNextSources) {
    const sources = new Map<string, string[]>();
    // TODO do we need the targets ?
    // const targets = new Map<string, string[]>();

    for (const [sourceId, { dropTargets }] of Object.entries(dragSources)) {
      const sourceEntry = sources.get(sourceId);
      const targetIds = Array.isArray(dropTargets)
        ? dropTargets
        : [dropTargets];
      if (sourceEntry) {
        sourceEntry.push(...targetIds);
      } else {
        sources.set(sourceId, targetIds);
      }
      // for (const targetId of targetIds) {
      //   const targetEntry = targets.get(targetId);
      //   if (targetEntry) {
      //     targetEntry.push(sourceId);
      //   } else {
      //     targets.set(targetId, [sourceId]);
      //   }
      // }
    }
    // return [sources, targets];
    return sources;
  }
}

export const isDraggable = (dragContext: IDragContext) =>
  dragContext.allowDrag === "local" || dragContext.allowDrag === "both";

const DragDropNextContext = createContext<IDragContext>({
  allowDrag: false,
  beginDrag: unconfiguredRegistrationCall,
  endDrag: unconfiguredRegistrationCall,
  dragState: undefined,
  drop: unconfiguredRegistrationCall,
  isDraggable: false,
  isDragContainer: () => false,
  registerDragDropParty: unconfiguredRegistrationCall,
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
  const contextValue = useMemo(
    () => new DragContext({ dragSources, local, onDrop }),
    [dragSources, local, onDrop],
  );

  return (
    <DragDropNextContext.Provider value={contextValue}>
      {children}
    </DragDropNextContext.Provider>
  );
};

export const useDragContext = () => {
  return useContext(DragDropNextContext);
};
