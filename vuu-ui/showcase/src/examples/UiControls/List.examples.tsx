import { Flexbox } from "@finos/vuu-layout";
import {
  DragDropProvider,
  dragStrategy,
  List,
  VirtualizedList,
} from "@finos/vuu-ui-controls";

import { ToggleButton, ToggleButtonGroup } from "@salt-ds/core";

import {
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usa_states } from "./List.data";
import { ListVisualizer } from "./ListVisualizer";

let displaySequence = 1;

export const DefaultList = () => {
  return (
    <List aria-label="Listbox example" maxWidth={292} source={usa_states} />
  );
};
DefaultList.displaySequence = displaySequence++;

export const ListHeight100Pct = () => {
  return (
    <Flexbox style={{ flexDirection: "column", width: 300, height: 800 }}>
      <div data-resizeable style={{ flex: 1, overflow: "hidden" }}>
        <List
          aria-label="Listbox example"
          maxWidth={292}
          source={usa_states}
          height="100%"
        />
      </div>
      <div data-resizeable style={{ flex: 1, overflow: "hidden" }}>
        <List
          aria-label="Listbox example"
          maxWidth={292}
          source={usa_states}
          height="100%"
        />
      </div>
    </Flexbox>
  );
};
ListHeight100Pct.displaySequence = displaySequence++;

export const DefaultVirtualisedList = () => {
  const [data, setData] = useState<string[]>([]);

  useEffect(() => {
    setTimeout(() => {
      setData(usa_states);
    }, 1000);
  }, []);

  const handleSelect = useCallback((evt, item) => {
    console.log("select", {
      item,
    });
  }, []);

  return (
    <VirtualizedList
      aria-label="Listbox example"
      maxWidth={292}
      onSelect={handleSelect}
      source={data}
    />
  );
};
DefaultVirtualisedList.displaySequence = displaySequence++;

export const MultiSelectionList = () => {
  return (
    <div style={{ display: "flex", gap: 24, width: 700, height: 600 }}>
      <List
        aria-label="MultiSelection Listbox example"
        checkable={false}
        width={292}
        selectionStrategy="multiple"
        source={usa_states}
      />
      <List
        aria-label="MultiSelection Listbox example"
        width={292}
        selectionStrategy="multiple"
        source={usa_states}
      />
    </div>
  );
};
MultiSelectionList.displaySequence = displaySequence++;

export const DraggableListItemsNoScroll = () => {
  const [data, setData] = useState(usa_states.slice(0, 10));

  const handleDrop = useCallback((fromIndex, toIndex) => {
    console.log(`drop ${fromIndex} ${toIndex}`);
    setData((data) => {
      const newData = data.slice();
      const [tab] = newData.splice(fromIndex, 1);
      if (toIndex === -1) {
        return newData.concat(tab);
      } else {
        newData.splice(toIndex, 0, tab);
        return newData;
      }
    });
  }, []);

  const handleSelect = useCallback((evt, item) => {
    console.log("select", {
      item,
    });
  }, []);

  return (
    <ListVisualizer>
      <List
        aria-label="Drag Drop Listbox example"
        allowDragDrop
        onSelect={handleSelect}
        maxWidth={292}
        onMoveListItem={handleDrop}
        selectionStrategy="multiple"
        source={data}
      />
    </ListVisualizer>
  );
};
DraggableListItemsNoScroll.displaySequence = displaySequence++;

export const DraggableListItems = () => {
  const [data, setData] = useState(usa_states);

  const handleDrop = useCallback((fromIndex, toIndex) => {
    console.log(`drop ${fromIndex} ${toIndex}`);
    setData((data) => {
      const newData = data.slice();
      const [tab] = newData.splice(fromIndex, 1);
      if (toIndex === -1) {
        return newData.concat(tab);
      } else {
        newData.splice(toIndex, 0, tab);
        return newData;
      }
    });
  }, []);

  const handleSelect = useCallback((evt, item) => {
    console.log("select", {
      item,
    });
  }, []);

  return (
    <ListVisualizer>
      <List
        aria-label="Drag Drop Listbox example"
        allowDragDrop
        onSelect={handleSelect}
        maxWidth={292}
        onMoveListItem={handleDrop}
        selectionStrategy="multiple"
        source={data}
      />
    </ListVisualizer>
  );
};
DraggableListItems.displaySequence = displaySequence++;

export const DraggableListItemsDropIndicator = () => {
  const dragStrategies: dragStrategy[] = useMemo(
    () => ["natural-movement", "drop-indicator"],
    []
  );

  const [data, setData] = useState(usa_states);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const handleDrop = useCallback((fromIndex, toIndex) => {
    console.log(`drop ${fromIndex} ${toIndex}`);
    setData((data) => {
      const newData = data.slice();
      const [tab] = newData.splice(fromIndex, 1);
      if (toIndex === -1) {
        return newData.concat(tab);
      } else {
        newData.splice(toIndex, 0, tab);
        return newData;
      }
    });
  }, []);

  const handleSelect = useCallback((evt, item) => {
    console.log("select", {
      item,
    });
  }, []);

  const handleChange = (evt: SyntheticEvent<HTMLButtonElement>) => {
    const { value } = evt.target as HTMLButtonElement;
    setSelectedIndex(parseInt(value));
  };

  return (
    <>
      <ToggleButtonGroup onChange={handleChange} value={selectedIndex}>
        <ToggleButton value={0}>Natural Movement</ToggleButton>
        <ToggleButton value={1}>Drop Indicator</ToggleButton>
      </ToggleButtonGroup>

      <ListVisualizer>
        <List
          aria-label="Drag Drop Listbox example"
          allowDragDrop={dragStrategies[selectedIndex]}
          key={dragStrategies[selectedIndex]}
          onSelect={handleSelect}
          maxWidth={292}
          onMoveListItem={handleDrop}
          selectionStrategy="default"
          source={data}
        />
      </ListVisualizer>
    </>
  );
};

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
          maxWidth={292}
          source={usa_states}
          allowDragDrop
        />
        <div style={{ flexBasis: 24, flexShrink: 0, flexGrow: 0 }} />
        <List
          aria-label="Listbox example"
          id="list2"
          maxWidth={292}
          source={usa_states}
          allowDragDrop
        />
      </Flexbox>
    </DragDropProvider>
  );
};
