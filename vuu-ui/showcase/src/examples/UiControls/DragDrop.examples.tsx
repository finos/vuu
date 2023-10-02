import { Flexbox } from "@finos/vuu-layout";
import { DragDropProvider, List } from "@finos/vuu-ui-controls";
import { useMemo } from "react";
import { usa_states } from "./List.data";

let displaySequence = 1;

export const DraggableLists = () => {
  const dragSource = useMemo(
    () => ({
      list1: { dropTargets: "list2" },
    }),
    []
  );

  return (
    <DragDropProvider dragSources={dragSource}>
      <Flexbox>
        <List
          aria-label="Listbox example"
          id="list1"
          itemHeight={36}
          maxWidth={292}
          source={usa_states}
          allowDragDrop
        />
        <div style={{ flexBasis: 24, flexShrink: 0, flexGrow: 0 }} />
        <List
          aria-label="Listbox example"
          id="list2"
          itemHeight={36}
          maxWidth={292}
          source={usa_states}
          allowDragDrop
        />
      </Flexbox>
    </DragDropProvider>
  );
};
DraggableLists.displaySequence = displaySequence++;
