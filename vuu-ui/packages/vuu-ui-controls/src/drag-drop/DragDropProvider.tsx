import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { MouseOffset } from "./dragDropTypesNext";
import { useGlobalDragDrop } from "./useGlobalDragDrop";

const NO_DRAG_CONTEXT = {
  isDragSource: false,
  isDropTarget: false,
  register: () => undefined,
};

const unconfiguredRegistrationCall = () =>
  console.log(`have you forgotten to provide a DragDrop Provider ?`);

export type DragOutHandler = (
  id: string,
  draggedEl: HTMLElement,
  mouseOffset?: MouseOffset
) => boolean;
export interface DragDropContextProps {
  dragSources?: Map<string, string[]>;
  dropTargets?: Map<string, string[]>;
  onDragOut?: DragOutHandler;
  registerDragDropParty: (id: string) => void;
}

const DragDropContext = createContext<DragDropContextProps>({
  registerDragDropParty: unconfiguredRegistrationCall,
});

export type DragSources = { [key: string]: { dropTargets: string | string[] } };
export interface DragDropProviderProps {
  children: ReactNode;
  dragSources: DragSources;
}

type MeasuredTarget = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

const measureDropTargets = (dropTargetIds: string[]) => {
  return dropTargetIds.reduce<Record<string, MeasuredTarget>>((map, id) => {
    const el = document.getElementById(id);
    if (el) {
      const { top, right, bottom, left } = el.getBoundingClientRect();
      map[id] = { top, right, bottom, left };
    }
    return map;
  }, {});
};

export const DragDropProvider = ({
  children,
  dragSources: dragSourcesProp,
}: DragDropProviderProps) => {
  const { resumeDrag } = useGlobalDragDrop();
  const [dragSources, dropTargets] = useMemo(() => {
    const sources = new Map<string, string[]>();
    // TODO do we need the targets ?
    const targets = new Map<string, string[]>();

    for (const [sourceId, { dropTargets }] of Object.entries(dragSourcesProp)) {
      const sourceEntry = sources.get(sourceId);
      const targetIds = Array.isArray(dropTargets)
        ? dropTargets
        : [dropTargets];
      if (sourceEntry) {
        sourceEntry.push(...targetIds);
      } else {
        sources.set(sourceId, targetIds);
      }
      for (const targetId of targetIds) {
        const targetEntry = targets.get(targetId);
        if (targetEntry) {
          targetEntry.push(sourceId);
        } else {
          targets.set(targetId, [sourceId]);
        }
      }
    }
    return [sources, targets];
  }, [dragSourcesProp]);

  console.log({
    dragSources,
    dropTargets,
  });

  const onDragOut = useCallback<DragOutHandler>(
    (id, draggedElement, mouseOffset) => {
      const measuredDropTargets = measureDropTargets(dragSources.get(id));

      console.log({ measuredDropTargets });
      resumeDrag(draggedElement, mouseOffset);
      return true;
    },
    [dragSources, resumeDrag]
  );

  const registerDragDropParty = useCallback((id: string) => {
    console.log(`registerDragDropParty ${id}`);
  }, []);

  const contextValue: DragDropContextProps = useMemo(
    () => ({
      dragSources,
      dropTargets,
      onDragOut,
      registerDragDropParty,
    }),
    [dragSources, dropTargets, onDragOut, registerDragDropParty]
  );

  return (
    <DragDropContext.Provider value={contextValue}>
      {children}
    </DragDropContext.Provider>
  );
};

export interface DragDropProviderResult {
  isDragSource: boolean;
  isDropTarget: boolean;
  onDragOut?: DragOutHandler;
  register: (id: string) => void;
}

export const useDragDropProvider = (id?: string): DragDropProviderResult => {
  const { dragSources, dropTargets, onDragOut, registerDragDropParty } =
    useContext(DragDropContext);
  if (id) {
    const isDragSource = dragSources?.has(id) ?? false;
    const isDropTarget = dropTargets?.has(id) ?? false;

    return {
      isDragSource,
      isDropTarget,
      onDragOut,
      register: registerDragDropParty,
    };
  } else {
    return NO_DRAG_CONTEXT;
  }
};
