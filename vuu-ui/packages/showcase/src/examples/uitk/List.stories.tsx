import { List, VirtualizedList } from "@heswell/uitk-lab";
import { useCallback, useEffect, useState } from "react";
import { usa_states } from "./List.data";
import { ListVisualizer } from "./ListVisualizer";

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
        allowDragDrop="drop-indicator"
        // allowDragDrop
        onSelect={handleSelect}
        maxWidth={292}
        onMoveListItem={handleDrop}
        selectionStrategy="default"
        source={data}
      />
    </ListVisualizer>
  );
};
