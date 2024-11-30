import { Flexbox } from "@finos/vuu-layout";
import {
  DragDropProvider,
  DragStartHandler,
  DropHandler,
  DropOptions,
  List,
  MoveItemHandler,
} from "@finos/vuu-ui-controls";
import { useCallback, useMemo, useState } from "react";
import { usa_states } from "./List.data";

export const DraggableListsOneWayDrag = () => {
  const [source1, source2] = useMemo(
    () => [usa_states.map((s) => `${s} 1`), usa_states.map((s) => `${s} 2`)],
    [],
  );
  const dragSource = useMemo(
    () => ({
      list1: { dropTargets: ["list1", "list2"] },
    }),
    [],
  );

  const [state1, setState1] = useState(source1);
  const [state2, setState2] = useState(source2);

  const handleMoveListItem1 = useCallback<MoveItemHandler>(
    (fromIndex, toIndex) => {
      setState1((data) => {
        const newData = data.slice();
        const [tab] = newData.splice(fromIndex, 1);
        if (toIndex === -1) {
          return newData.concat(tab);
        } else {
          newData.splice(toIndex, 0, tab);
          return newData;
        }
      });
    },
    [],
  );

  const handleMoveListItem2 = useCallback<MoveItemHandler>(
    (fromIndex, toIndex) => {
      setState2((data) => {
        const newData = data.slice();
        const [tab] = newData.splice(fromIndex, 1);
        if (toIndex === -1) {
          return newData.concat(tab);
        } else {
          newData.splice(toIndex, 0, tab);
          return newData;
        }
      });
    },
    [],
  );

  const handleDragStart1 = useCallback<DragStartHandler>(
    (dragDropState) => {
      const { initialDragElement } = dragDropState;
      const {
        dataset: { index = "-1" },
      } = initialDragElement;

      const value = state1[parseInt(index)];
      if (value) {
        dragDropState.setPayload(value);
      }
    },
    [state1],
  );
  const handleDragStart2 = useCallback<DragStartHandler>((dragDropState) => {
    console.log("handleDragStart2", {
      dragDropState,
    });
  }, []);

  const handleDrop2 = useCallback<DropHandler>(
    ({ toIndex, payload }: DropOptions) => {
      setState2((data) => {
        const newData = data.slice();
        if (toIndex === -1) {
          return newData.concat(payload as string);
        } else {
          newData.splice(toIndex, 0, payload as string);
          return newData;
        }
      });
    },
    [],
  );

  return (
    <DragDropProvider dragSources={dragSource}>
      <Flexbox>
        <List
          allowDragDrop
          aria-label="Listbox example"
          id="list1"
          itemHeight={36}
          maxWidth={292}
          onDragStart={handleDragStart1}
          onMoveListItem={handleMoveListItem1}
          source={state1}
          width={200}
        />
        <div style={{ flexBasis: 24, flexShrink: 0, flexGrow: 0 }} />
        <List
          allowDragDrop
          aria-label="Listbox example"
          id="list2"
          itemHeight={36}
          maxWidth={292}
          onDragStart={handleDragStart2}
          onDrop={handleDrop2}
          onMoveListItem={handleMoveListItem2}
          source={state2}
          width={200}
        />
      </Flexbox>
    </DragDropProvider>
  );
};
