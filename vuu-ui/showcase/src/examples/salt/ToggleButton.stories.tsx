import {
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupChangeEventHandler
} from "@heswell/salt-lab";

import "@heswell/component-anatomy/esm/index.css";
import { useState } from "react";

export const ButtonGroupWithTextOnly = () => {
  const [selectedIndex, setSelectedIndex] = useState<number>(1);

  const handleChange: ToggleButtonGroupChangeEventHandler = (
    _,
    index,
    toggled
  ) => {
    console.log(`onChange [${index}] toggled ${toggled}`);
    setSelectedIndex(index);
  };

  return (
    <ToggleButtonGroup onChange={handleChange} selectedIndex={selectedIndex}>
      <ToggleButton aria-label="alert" tooltipText="Alert">
        Alert
      </ToggleButton>
      <ToggleButton aria-label="home" tooltipText="Home">
        Home
      </ToggleButton>
      <ToggleButton tooltipText="Search">Search</ToggleButton>
      <ToggleButton aria-label="print" tooltipText="Print">
        Print
      </ToggleButton>
    </ToggleButtonGroup>
  );
};
