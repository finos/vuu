import { SyntheticEvent, useCallback, useMemo, useRef, useState } from "react";

import {
  Dropdown,
  MultiSelectionHandler,
  SingleSelectionHandler,
} from "@finos/vuu-ui-controls";
import { Button, ToggleButton, ToggleButtonGroup } from "@salt-ds/core";
import { ArrowDownIcon, ArrowUpIcon } from "@salt-ds/icons";
import { usa_states } from "./List.data";

let displaySequence = 1;

export const DefaultDropdown = () => {
  const handleSelectionChange = useCallback<SingleSelectionHandler>(
    (event, selected) => {
      console.log(`selection changed ${selected}`);
    },
    []
  );
  return (
    <Dropdown
      defaultSelected={usa_states[0]}
      onSelectionChange={handleSelectionChange}
      source={usa_states.slice(0, 10)}
    />
  );
};

DefaultDropdown.displaySequence = displaySequence++;

export const SizedDropdown = () => {
  const handleChange: SingleSelectionHandler = (event, selectedItem) => {
    console.log("selection changed", selectedItem);
  };
  return (
    <Dropdown
      defaultSelected={usa_states[0]}
      fullWidth
      onSelectionChange={handleChange}
      source={usa_states}
    />
  );
};

SizedDropdown.displaySequence = displaySequence++;

export const FullyControlledDropdown = () => {
  const buttonsRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const handleArrowDown = () => {
    setHighlightedIndex((prevHighlightedIndex) =>
      Math.min(usa_states.length - 1, prevHighlightedIndex + 1)
    );
  };

  const handleArrowUp = () => {
    setHighlightedIndex((prevHighlightedIndex) =>
      Math.max(0, prevHighlightedIndex - 1)
    );
  };

  const handleSelect = () => {
    setSelectedItem(usa_states[highlightedIndex] || null);
  };
  const handleOpen = () => {
    setOpen(!open);
  };

  return (
    <div style={{ display: "inline-flex", gap: 16 }}>
      <Dropdown
        ListProps={{
          highlightedIndex,
        }}
        defaultSelected={usa_states[0]}
        isOpen={open}
        selected={selectedItem}
        source={usa_states}
      />
      <div
        ref={buttonsRef}
        style={{ display: "flex", justifyContent: "flex-end", zIndex: 1 }}
      >
        <Button onClick={handleOpen} style={{ width: 80 }}>
          {open ? "Close" : "Open"}
        </Button>
        <Button
          disabled={!open || highlightedIndex === usa_states.length - 1}
          onClick={handleArrowDown}
        >
          <ArrowDownIcon />
        </Button>
        <Button
          disabled={!open || highlightedIndex <= 0}
          onClick={handleArrowUp}
        >
          <ArrowUpIcon />
        </Button>
        <Button disabled={!open} onClick={handleSelect}>
          Select
        </Button>
      </div>
    </div>
  );
};

FullyControlledDropdown.displaySequence = displaySequence++;

export const DataOnDemand = () => {
  const [data, setData] = useState(["EUR"]);

  const handleChange: SingleSelectionHandler = (event, selectedItem) => {
    console.log("selection changed", selectedItem);
  };

  const handleOpenChange = useCallback((isOpen) => {
    if (isOpen) {
      setTimeout(() => {
        setData(["AUD", "CHF", "EUR", "GBP", "USD"]);
      }, 300);
    }
  }, []);

  return (
    <Dropdown
      selected={"EUR"}
      fullWidth
      onOpenChange={handleOpenChange}
      onSelectionChange={handleChange}
      source={data}
    />
  );
};

DataOnDemand.displaySequence = displaySequence++;

export const SwitchDataSource = () => {
  const [index, setIndex] = useState(0);
  const [, forceUpdate] = useState({});
  const selectedRef = useRef<string | null>("CHF");
  const data = useMemo(
    () => [
      ["AUD", "CHF", "EUR", "GBP", "USD"],
      ["Red", "Orange", "Yellow", "Green", "Blue", "Indigo", "Violet"],
      ["Audi", "BMW", "Chrysler", "Dodge", "Eagle", "Fiat"],
    ],
    []
  );
  const source = useMemo(() => data[index], [data, index]);

  const handleOpenChange = useCallback((isOpen) => {
    if (isOpen) {
      console.log("its open");
    }
  }, []);

  const handleSelectionChange = useCallback<SingleSelectionHandler>(
    (evt, value) => {
      if (value !== null) {
        selectedRef.current = value;
        forceUpdate({});
      }
    },
    []
  );

  const handleChange = useCallback((evt: SyntheticEvent<HTMLButtonElement>) => {
    const { value } = evt.target as HTMLButtonElement;
    selectedRef.current = null;
    setIndex(parseInt(value));
  }, []);

  return (
    <>
      <ToggleButtonGroup value={index} onChange={handleChange}>
        <ToggleButton value={0}>Currencies</ToggleButton>
        <ToggleButton value={1}>Colours</ToggleButton>
        <ToggleButton value={2}>Car Manufacturers</ToggleButton>
      </ToggleButtonGroup>
      <Dropdown
        selected={selectedRef.current}
        fullWidth
        onOpenChange={handleOpenChange}
        onSelectionChange={handleSelectionChange}
        source={source}
      />
    </>
  );
};

SwitchDataSource.displaySequence = displaySequence++;

export const MultiSelectDropdown = () => {
  const handleSelectionChange = useCallback<MultiSelectionHandler<string>>(
    (event, selected) => {
      console.log(`selectionChange ${JSON.stringify(selected)}`);
    },
    []
  );
  return (
    <Dropdown
      defaultSelected={[usa_states[0]]}
      onSelectionChange={handleSelectionChange}
      selectionStrategy="multiple"
      source={usa_states}
    />
  );
};

MultiSelectDropdown.displaySequence = displaySequence++;
