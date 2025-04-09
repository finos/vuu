import { Flexbox } from "@finos/vuu-layout";
import {
  dragStrategy,
  List,
  ListItem,
  MultiSelectionHandler,
  SelectHandler,
  SingleSelectionHandler,
} from "@finos/vuu-ui-controls";

import { Input, ToggleButton, ToggleButtonGroup } from "@salt-ds/core";

import {
  SyntheticEvent,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usa_states, usa_states_cities } from "./List.data";

export const DefaultList = () => {
  const handleSelect = useCallback<SelectHandler>((evt, selected) => {
    console.log(`handleSelect ${selected}`);
  }, []);
  const handleSelectionChange = useCallback<SingleSelectionHandler>(
    (evt, selected) => {
      console.log(`handleSelectionChange ${selected}`);
    },
    [],
  );
  return (
    <List
      aria-label="Listbox example"
      itemHeight={36}
      maxWidth={292}
      onSelect={handleSelect}
      onSelectionChange={handleSelectionChange}
      source={usa_states}
    />
  );
};

export const FixedWidthList = () => {
  const handleSelect = useCallback<SelectHandler>((evt, selected) => {
    console.log(`handleSelect`, { selected });
  }, []);
  const handleSelectionChange = useCallback<SingleSelectionHandler>(
    (evt, selected) => {
      console.log(`handleSelectionChange`, { selected });
    },
    [],
  );
  return (
    <List
      aria-label="Listbox example"
      itemHeight={36}
      width={200}
      onSelect={handleSelect}
      onSelectionChange={handleSelectionChange}
      source={usa_states}
    />
  );
};

export const DefaultSelectedItem = () => {
  const handleSelect = useCallback<SelectHandler>((evt, selected) => {
    console.log(`handleSelect`, { selected });
  }, []);
  const handleSelectionChange = useCallback<SingleSelectionHandler>(
    (evt, selected) => {
      console.log(`handleSelectionChange`, { selected });
    },
    [],
  );
  return (
    <List
      aria-label="Listbox example"
      itemHeight={36}
      defaultSelected={usa_states[3]}
      width={200}
      onSelect={handleSelect}
      onSelectionChange={handleSelectionChange}
      source={usa_states}
    />
  );
};

export const InlineListItems = () => {
  const handleSelect = useCallback<SelectHandler>((evt, selected) => {
    console.log(`handleSelect`, { selected });
  }, []);
  const handleSelectionChange = useCallback<SingleSelectionHandler>(
    (evt, selected) => {
      console.log(`handleSelectionChange`, { selected });
    },
    [],
  );
  return (
    <List
      aria-label="Listbox example"
      maxWidth={292}
      onSelect={handleSelect}
      onSelectionChange={handleSelectionChange}
    >
      {usa_states.map((state) => (
        <ListItem key={state}>{state}</ListItem>
      ))}
    </List>
  );
};

export const ListExtendedSelection = () => {
  const handleSelectionChange = useCallback<MultiSelectionHandler>(
    (evt, selected) => {
      console.log(`handleSelectionChange`, { selected });
    },
    [],
  );
  return (
    <List
      aria-label="Listbox example"
      maxWidth={292}
      onSelectionChange={handleSelectionChange}
      selectionStrategy="extended"
      source={usa_states}
    />
  );
};

export const ListFocusAndHighlightedIndex = () => {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, []);

  return (
    <List
      aria-label="Listbox example"
      defaultHighlightedIndex={0}
      maxWidth={292}
      ref={ref}
      source={usa_states}
    />
  );
};

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

export const MultiSelectionList = () => {
  const handleSelect = useCallback<SelectHandler>((evt, selected) => {
    console.log(`handleSelect`, { selected });
  }, []);
  const handleSelectionChange = useCallback<MultiSelectionHandler>(
    (evt, selected) => {
      console.log(`handleSelectionChange`, { selected });
    },
    [],
  );

  return (
    <div style={{ display: "flex", gap: 24, width: 700, height: 600 }}>
      <List
        aria-label="MultiSelection Listbox example"
        checkable={false}
        onSelect={handleSelect}
        onSelectionChange={handleSelectionChange}
        selectionStrategy="multiple"
        source={usa_states}
        width={292}
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

export const DraggableListItemsNoScroll = () => {
  const [data, setData] = useState(usa_states.slice(0, 10));

  const handleDrop = useCallback((fromIndex: number, toIndex: number) => {
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

  const handleSelect = useCallback<SelectHandler>((evt, item) => {
    console.log("select", {
      item,
    });
  }, []);

  return (
    <List
      aria-label="Drag Drop Listbox example"
      allowDragDrop
      onSelect={handleSelect}
      maxWidth={292}
      onMoveListItem={handleDrop}
      selectionStrategy="multiple"
      source={data}
    />
  );
};

export const DraggableListItems = () => {
  const [data, setData] = useState(usa_states);

  const handleDrop = useCallback((fromIndex: number, toIndex: number) => {
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

  const handleSelect = useCallback<SelectHandler>((evt, item) => {
    console.log("select", {
      item,
    });
  }, []);

  return (
    <List
      aria-label="Drag Drop Listbox example"
      allowDragDrop
      data-showcase-center
      // itemHeight={24}
      onSelect={handleSelect}
      maxWidth={292}
      onMoveListItem={handleDrop}
      selectionStrategy="multiple"
      source={data}
      style={{ border: "solid 1px blue" }}
      width={300}
    />
  );
};

export const DraggableListItemsDropIndicator = () => {
  const dragStrategies: dragStrategy[] = useMemo(
    () => ["natural-movement", "drop-indicator"],
    [],
  );

  const [data, setData] = useState(usa_states);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const handleDrop = useCallback((fromIndex: number, toIndex: number) => {
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

  const handleSelect = useCallback<SelectHandler>((evt, item) => {
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
    </>
  );
};

export const ListWithinFlexLayout = () => {
  const handleSelect = useCallback<SelectHandler>((evt, selected) => {
    console.log(`handleSelect`, { selected });
  }, []);
  const handleSelectionChange = useCallback<SingleSelectionHandler>(
    (evt, selected) => {
      console.log(`handleSelectionChange`, { selected });
    },
    [],
  );

  return (
    <div
      style={{
        border: "solid 1px black",
        display: "flex",
        flexDirection: "column",
        height: 602,
        width: 402,
      }}
    >
      <div style={{ flex: "0 0 50px", background: "red" }} />
      <div style={{ flex: "1 1 0" }}>
        <List
          aria-label="Listbox example"
          height="100%"
          maxWidth={292}
          onSelect={handleSelect}
          onSelectionChange={handleSelectionChange}
          source={usa_states}
          width="100%"
        />
      </div>
      <div style={{ flex: "0 0 50px", background: "green" }} />
    </div>
  );
};

export const DefaultSelectedWithinViewport = () => {
  const handleSelect = useCallback<SelectHandler>((evt, selected) => {
    console.log(`handleSelect`, { selected });
  }, []);
  const handleSelectionChange = useCallback<SingleSelectionHandler>(
    (evt, selected) => {
      console.log(`handleSelectionChange`, { selected });
    },
    [],
  );
  return (
    <>
      <Input />
      <List
        aria-label="Listbox example"
        defaultSelected="Arizona"
        itemHeight={36}
        maxWidth={292}
        onSelect={handleSelect}
        onSelectionChange={handleSelectionChange}
        source={usa_states}
      />
    </>
  );
};

export const GroupedList = () => {
  const handleSelect = useCallback<SelectHandler>((evt, selected) => {
    console.log(`handleSelect ${selected}`);
  }, []);
  const handleSelectionChange = useCallback<SingleSelectionHandler>(
    (evt, selected) => {
      console.log(`handleSelectionChange ${selected}`);
    },
    [],
  );

  return (
    <List<any>
      aria-label="Listbox example"
      itemHeight={36}
      maxWidth={292}
      onSelect={handleSelect}
      onSelectionChange={handleSelectionChange}
      source={usa_states_cities}
    />
  );
};

export const GroupedListCollapsibleHeaders = () => {
  const handleSelect = useCallback<SelectHandler>((evt, selected) => {
    console.log(`handleSelect ${selected}`);
  }, []);
  const handleSelectionChange = useCallback<SingleSelectionHandler>(
    (evt, selected) => {
      console.log(`handleSelectionChange ${selected}`);
    },
    [],
  );

  return (
    <List<any>
      aria-label="Listbox example"
      collapsibleHeaders
      itemHeight={36}
      maxWidth={292}
      onSelect={handleSelect}
      onSelectionChange={handleSelectionChange}
      source={usa_states_cities}
    />
  );
};
