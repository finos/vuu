// import { ComponentAnatomy } from '@heswell/component-anatomy';
import {
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupChangeEventHandler,
} from "@heswell/salt-lab";

import "@heswell/component-anatomy/esm/index.css";
import { useState } from "react";

export const ButtonGroupWithTextOnly = () => {
  const [selectedIndex, setSelectedIndex] = useState<number>(1);

  const handleChange: ToggleButtonGroupChangeEventHandler = (
    event,
    index,
    toggled
  ) => {
    console.log(`onChange [${index}] toggled ${toggled}`);
    setSelectedIndex(index);
  };

  return (
    <ToggleButtonGroup onChange={handleChange} selectedIndex={selectedIndex}>
      <ToggleButton ariaLabel="alert" tooltipText="Alert">
        Alert
      </ToggleButton>
      <ToggleButton ariaLabel="home" tooltipText="Home">
        Home
      </ToggleButton>
      <ToggleButton tooltipText="Search">Search</ToggleButton>
      <ToggleButton ariaLabel="print" tooltipText="Print">
        Print
      </ToggleButton>
    </ToggleButtonGroup>
  );
};
