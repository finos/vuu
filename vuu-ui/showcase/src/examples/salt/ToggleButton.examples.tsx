// import { ComponentAnatomy } from '@heswell/component-anatomy';
import { ToggleButton, ToggleButtonGroup } from "@salt-ds/core";
import { useState } from "react";

import "./ToggleButton.examples.css";

let displaySequence = 1;

export const ButtonGroupWithTextOnly = () => {
  const [selectedIndex, setSelectedIndex] = useState<number>(1);

  const handleChange = (event, index, toggled) => {
    console.log(`onChange [${index}] toggled ${toggled}`);
    setSelectedIndex(index);
  };

  return (
    <ToggleButtonGroup onChange={handleChange} selectedIndex={selectedIndex}>
      <ToggleButton tooltipText="Alert">Alert</ToggleButton>
      <ToggleButton tooltipText="Home">Home</ToggleButton>
      <ToggleButton tooltipText="Search">Search</ToggleButton>
      <ToggleButton tooltipText="Print">Print</ToggleButton>
    </ToggleButtonGroup>
  );
};

ButtonGroupWithTextOnly.displaySequence = displaySequence++;

export const ButtonGroupWithIconOnly = () => {
  const [selectedIndex, setSelectedIndex] = useState<number>(1);
  const [selectedIndexCta, setSelectedIndexCta] = useState<number>(1);
  const [selectedIndexSecondary, setSelectedIndexSecondary] =
    useState<number>(1);

  const handleChange = (event, index) => {
    setSelectedIndex(index);
  };

  const handleChangeCta = (event, index) => {
    setSelectedIndexCta(index);
  };

  const handleChangeSecondary = (event, index) => {
    setSelectedIndexSecondary(index);
  };

  return (
    <div
      className="vuuToggleButtonExample"
      style={{
        display: "flex",
        height: 150,
        flexDirection: "column",
        justifyContent: "space-between",
        margin: "0 auto",
        width: "fit-content",
      }}
    >
      <ToggleButtonGroup
        onChange={handleChangeSecondary}
        selectedIndex={selectedIndexSecondary}
        variant="secondary"
      >
        <ToggleButton
          aria-label="alert"
          data-icon="notifications"
          tooltipText="Alert"
        />
        <ToggleButton aria-label="home" tooltipText="Home" data-icon="home" />
        <ToggleButton
          aria-label="search"
          data-icon="search"
          tooltipText="Search"
        />
        <ToggleButton
          aria-label="print"
          tooltipText="Print"
          data-icon="print"
        />
      </ToggleButtonGroup>

      <ToggleButtonGroup onChange={handleChange} selectedIndex={selectedIndex}>
        <ToggleButton
          aria-label="alert"
          className="saltToggleButton-iconOnly"
          tooltipText="Alert"
          data-icon="notifications"
        />
        <ToggleButton aria-label="home" tooltipText="Home" data-icon="home" />
        <ToggleButton
          aria-label="search"
          tooltipText="Search"
          data-icon="search"
        />
        <ToggleButton
          aria-label="print"
          tooltipText="Print"
          data-icon="print"
        />
      </ToggleButtonGroup>

      <ToggleButtonGroup
        onChange={handleChangeCta}
        selectedIndex={selectedIndexCta}
        variant="cta"
      >
        <ToggleButton
          aria-label="alert"
          tooltipText="Alert"
          data-icon="notifications"
        />
        <ToggleButton aria-label="home" tooltipText="Home" data-icon="home" />
        <ToggleButton
          aria-label="search"
          tooltipText="Search"
          data-icon="search"
        />
        <ToggleButton
          aria-label="print"
          tooltipText="Print"
          data-icon="print"
        />
      </ToggleButtonGroup>
    </div>
  );
};

ButtonGroupWithIconOnly.displaySequence = displaySequence++;
