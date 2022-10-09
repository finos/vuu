import { useRef, useState } from "react";

import { ArrowDownIcon, ArrowUpIcon } from "@heswell/uitk-icons";
import { Button } from "@heswell/uitk-core";
import { Dropdown, List, SelectionChangeHandler } from "@heswell/uitk-lab";
import { usa_states } from "./List.data";

const story = {
  title: "UI Controls/Dropdown",
  component: List,
};

export default story;

let displaySequence = 1;

export const DefaultDropdown = () => {
  const handleChange: SelectionChangeHandler = (event, selectedItem) => {
    console.log("selection changed", selectedItem);
  };
  return (
    <Dropdown
      defaultSelected={usa_states[0]}
      onSelectionChange={handleChange}
      source={usa_states}
    />
  );
};

export const SizedDropdown = () => {
  const handleChange: SelectionChangeHandler = (event, selectedItem) => {
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
        style={{ display: "flex", justifyContent: "flex-end", zIndex: 1 }}>
        <Button onClick={handleOpen} style={{ width: 80 }}>
          {open ? "Close" : "Open"}
        </Button>
        <Button
          disabled={!open || highlightedIndex === usa_states.length - 1}
          onClick={handleArrowDown}>
          <ArrowDownIcon />
        </Button>
        <Button
          disabled={!open || highlightedIndex <= 0}
          onClick={handleArrowUp}>
          <ArrowUpIcon />
        </Button>
        <Button disabled={!open} onClick={handleSelect}>
          Select
        </Button>
      </div>
    </div>
  );
};

DefaultDropdown.displaySequence = displaySequence++;
