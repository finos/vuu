import { List, VirtualizedList } from "@heswell/uitk-lab";
import { useCallback, useEffect, useState } from "react";
import { usa_states } from "./List.data";

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
      console.log(`handleDrop from ${fromIndex} to ${toIndex}`);
      const newData = data.slice();
      const [tab] = newData.splice(fromIndex, 1);
      if (toIndex === -1) {
        setData(newData.concat(tab));
      } else {
        // const offset = toIndex < fromIndex ? +1 : 0;
        newData.splice(toIndex, 0, tab);
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
    <List
      aria-label="Drag Drop Listbox example"
      allowDragDrop
      maxWidth={292}
      onMoveListItem={handleDrop}
      source={data}
    />
  );
};
