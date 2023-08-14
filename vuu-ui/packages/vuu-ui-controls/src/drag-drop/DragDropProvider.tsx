import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
} from "react";

const NO_DRAG_CONTEXT = {
  isDragSource: false,
  isDropTarget: false,
  register: () => undefined,
};

const unconfiguredRegistrationCall = () =>
  console.log(`have you forgotten to provide a DragDrop Provider ?`);

export interface DragDropContextProps {
  dragSources?: Map<string, string[]>;
  dropTargets?: Map<string, string[]>;
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

export const DragDropProvider = ({
  children,
  dragSources: dragSourcesProp,
}: DragDropProviderProps) => {
  const [dragSources, dropTargets] = useMemo(() => {
    const sources = new Map<string, string[]>();
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

  const registerDragDropParty = useCallback((id: string) => {
    console.log(`registerDragDropParty ${id}`);
  }, []);

  const contextValue: DragDropContextProps = useMemo(
    () => ({
      dragSources,
      dropTargets,
      registerDragDropParty,
    }),
    [dragSources, dropTargets, registerDragDropParty]
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
  register: (id: string) => void;
}

export const useDragDropProvider = (id?: string): DragDropProviderResult => {
  const { dragSources, dropTargets, registerDragDropParty } =
    useContext(DragDropContext);
  if (id) {
    const isDragSource = dragSources?.has(id) ?? false;
    const isDropTarget = dropTargets?.has(id) ?? false;

    return {
      isDragSource,
      isDropTarget,
      register: registerDragDropParty,
    };
  } else {
    return NO_DRAG_CONTEXT;
  }
};
