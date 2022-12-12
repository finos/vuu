import {
  DragDropProvider,
  List,
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupChangeEventHandler,
  VirtualizedList,
} from "@heswell/uitk-lab";
import { dragStrategy } from "@heswell/uitk-lab/src/tabs/drag-drop";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usa_states } from "./List.data";
import { ListVisualizer } from "./ListVisualizer";
import { Flexbox } from "@vuu-ui/vuu-layout";

export const DefaultList = () => {
  return (
    <List aria-label="Listbox example" maxWidth={292} source={usa_states} />
  );
};

export const DefaultVirtualisedList = () => {
  const [data, setData] = useState([]);

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

const applyDrop = function <T>(
  data: T[],
  fromIndex: number,
  toIndex: number
): T[] {
  const newData = data.slice();
  const [item] = newData.splice(fromIndex, 1);
  if (toIndex === -1) {
    return newData.concat(item);
  } else {
    console.log(`old data ${data.slice(0, 10).join(",")}`);
    const offset = toIndex > fromIndex ? 0 : 0;
    newData.splice(toIndex + offset, 0, item);
    console.log(`new data ${newData.slice(0, 10).join(",")}`);
    return newData;
  }
};

export const DraggableListItems = () => {
  const [data, setData] = useState(usa_states);

  const handleDrop = useCallback(
    (fromIndex, toIndex) => {
      const newData = data.slice();
      const [item] = newData.splice(fromIndex, 1);
      if (toIndex === -1) {
        setData(newData.concat(item));
      } else {
        const offset = toIndex > fromIndex ? 0 : 0;
        newData.splice(toIndex + offset, 0, item);
        setData(newData);
      }
    },
    [data]
  );

  const handleSelect = useCallback((evt, item) => {
    console.log("select", {
      item,
    });
  }, []);

  return (
    <ListVisualizer>
      <List
        // itemHeight={50}
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
export const DraggableListItemsDropIndicator = () => {
  const dragStrategies: dragStrategy[] = useMemo(
    () => ["natural-movement", "drop-indicator"],
    []
  );

  const [data, setData] = useState(usa_states);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const handleDrop = useCallback((fromIndex, toIndex) => {
    setData((data) => applyDrop(data, fromIndex, toIndex));
  }, []);

  const handleSelect = useCallback((evt, item) => {
    console.log("select", {
      item,
    });
  }, []);

  const handleChange: ToggleButtonGroupChangeEventHandler = (
    event,
    index,
    toggled
  ) => {
    console.log(`onChange [${index}] toggled ${toggled}`);
    setSelectedIndex(index);
  };

  return (
    <>
      <ToggleButtonGroup onChange={handleChange} selectedIndex={selectedIndex}>
        <ToggleButton>Natural Movement</ToggleButton>
        <ToggleButton>Drop Indicator</ToggleButton>
      </ToggleButtonGroup>

      <ListVisualizer>
        <List
          // itemHeight={50}
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
