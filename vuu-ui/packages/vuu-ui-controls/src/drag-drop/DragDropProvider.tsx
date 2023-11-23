import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { DragDropState } from "./DragDropState";
import {
  GlobalDropHandler,
  ResumeDragHandler,
  useGlobalDragDrop,
} from "./useGlobalDragDrop";

const NO_DRAG_CONTEXT = {
  isDragSource: undefined,
  isDropTarget: undefined,
  register: () => undefined,
};

const unconfiguredRegistrationCall = () =>
  console.log(`have you forgotten to provide a DragDrop Provider ?`);

export type DragOutHandler = (
  id: string,
  dragDropState: DragDropState
) => boolean;

export type DragDropRegistrationFn = (
  id: string,
  resumeDrag: ResumeDragHandler | false,
  onDrop?: GlobalDropHandler
) => void;

export type EndOfDragOperationHandler = (id: string) => void;

export interface DragDropContextProps {
  dragSources?: Map<string, string[]>;
  dropTargets?: Map<string, string[]>;
  onDragOut?: DragOutHandler;
  onEndOfDragOperation?: EndOfDragOperationHandler;
  registerDragDropParty: DragDropRegistrationFn;
}

const DragDropContext = createContext<DragDropContextProps>({
  registerDragDropParty: unconfiguredRegistrationCall,
});

export type DragSources = { [key: string]: { dropTargets: string | string[] } };
export interface DragDropProviderProps {
  children: ReactNode;
  dragSources: DragSources;
}

export type MeasuredTarget = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

const measureDropTargets = (dropTargetIds: string[] = []) => {
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
  const resumeDragHandlers = useMemo(
    () => new Map<string, ResumeDragHandler>(),
    []
  );
  const dropHandlers = useMemo(() => new Map<string, GlobalDropHandler>(), []);
  const handleDragOverDropTarget = useCallback(
    (dropTargetId: string, dragDropState: DragDropState) => {
      const resumeDrag = resumeDragHandlers.get(dropTargetId);
      if (resumeDrag) {
        return resumeDrag(dragDropState);
      } else {
        return false;
      }
    },
    [resumeDragHandlers]
  );

  const handleDrop = useCallback(
    (dropTargetId: string, dragDropState: DragDropState) => {
      const handleDrop = dropHandlers.get(dropTargetId);
      if (handleDrop) {
        handleDrop(dragDropState);
      }
    },
    [dropHandlers]
  );

  const { measuredDropTargetsRef, resumeDrag } = useGlobalDragDrop({
    onDragOverDropTarget: handleDragOverDropTarget,
    onDrop: handleDrop,
  });
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

  const onDragOut = useCallback<DragOutHandler>(
    (id, dragDropState) => {
      // we call releaseItem if and when the dragged item is dropped onto a remote dropTarget
      measuredDropTargetsRef.current = measureDropTargets(dragSources.get(id));
      resumeDrag(dragDropState);
      return true;
    },
    [dragSources, measuredDropTargetsRef, resumeDrag]
  );

  const onEndOfDragOperation = useCallback<EndOfDragOperationHandler>((id) => {
    console.log(`end of drag operation, id= ${id}`);
  }, []);

  const registerDragDropParty = useCallback<DragDropRegistrationFn>(
    (id, resumeDrag, onDrop) => {
      if (resumeDrag) {
        resumeDragHandlers.set(id, resumeDrag);
      } else if (onDrop) {
        dropHandlers.set(id, onDrop);
      }
    },
    [dropHandlers, resumeDragHandlers]
  );

  const contextValue: DragDropContextProps = useMemo(
    () => ({
      dragSources,
      dropTargets,
      onDragOut,
      onEndOfDragOperation,
      registerDragDropParty,
    }),
    [
      dragSources,
      dropTargets,
      onDragOut,
      onEndOfDragOperation,
      registerDragDropParty,
    ]
  );

  return (
    <DragDropContext.Provider value={contextValue}>
      {children}
    </DragDropContext.Provider>
  );
};

export interface DragDropProviderResult {
  isDragSource?: boolean;
  isDropTarget?: boolean;
  onDragOut?: DragOutHandler;
  onEndOfDragOperation?: (id: string) => void;
  register: DragDropRegistrationFn;
}

export const useDragDropProvider = (id?: string): DragDropProviderResult => {
  const {
    dragSources,
    dropTargets,
    onDragOut,
    onEndOfDragOperation,
    registerDragDropParty,
  } = useContext(DragDropContext);
  if (id && (dragSources || dropTargets)) {
    const isDragSource = dragSources?.has(id) ?? false;
    const isDropTarget = dropTargets?.has(id) ?? false;

    return {
      isDragSource,
      isDropTarget,
      onDragOut,
      onEndOfDragOperation,
      register: registerDragDropParty,
    };
  } else {
    return NO_DRAG_CONTEXT;
  }
};
