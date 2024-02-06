import { ToggleButton, ToggleButtonGroup } from "@salt-ds/core";
import { SyntheticEvent, useState } from "react";

import "./ToggleButton.examples.css";

let displaySequence = 1;

export const ButtonGroupWithTextOnly = () => {
  const [selectedIndex, setSelectedIndex] = useState<number>(1);

  const handleChange = (evt: SyntheticEvent<HTMLButtonElement>) => {
    setSelectedIndex(parseInt((evt.target as HTMLButtonElement).value));
  };

  return (
    <ToggleButtonGroup
      data-showcase-center
      onChange={handleChange}
      value={selectedIndex}
    >
      <ToggleButton value={0}>Alert</ToggleButton>
      <ToggleButton value={1}>Home</ToggleButton>
      <ToggleButton value={2}>Search</ToggleButton>
      <ToggleButton value={3}>Print</ToggleButton>
    </ToggleButtonGroup>
  );
};

ButtonGroupWithTextOnly.displaySequence = displaySequence++;

export const ButtonGroupWithIconOnly = () => {
  const [selectedIndex, setSelectedIndex] = useState<number>(1);
  const [selectedIndexCta, setSelectedIndexCta] = useState<number>(1);
  const [selectedIndexSecondary, setSelectedIndexSecondary] =
    useState<number>(1);

  const handleChange = (evt: SyntheticEvent<HTMLButtonElement>) => {
    setSelectedIndex(parseInt((evt.target as HTMLButtonElement).value));
  };

  const handleChangeCta = (evt: SyntheticEvent<HTMLButtonElement>) => {
    setSelectedIndexCta(parseInt((evt.target as HTMLButtonElement).value));
  };

  const handleChangeSecondary = (evt: SyntheticEvent<HTMLButtonElement>) => {
    setSelectedIndexSecondary(
      parseInt((evt.target as HTMLButtonElement).value)
    );
  };

  return (
    <div
      className="vuuToggleButtonExample"
      data-showcase-center
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
        value={selectedIndexSecondary}
      >
        <ToggleButton value={0} aria-label="alert" data-icon="notifications" />
        <ToggleButton value={1} aria-label="home" data-icon="home" />
        <ToggleButton value={2} aria-label="search" data-icon="search" />
        <ToggleButton value={3} aria-label="print" data-icon="print" />
      </ToggleButtonGroup>

      <ToggleButtonGroup onChange={handleChange} value={selectedIndex}>
        <ToggleButton
          aria-label="alert"
          className="saltToggleButton-iconOnly"
          data-icon="notifications"
          value={0}
        />
        <ToggleButton aria-label="home" data-icon="home" value={1} />
        <ToggleButton aria-label="search" data-icon="search" value={2} />
        <ToggleButton aria-label="print" data-icon="print" value={3} />
      </ToggleButtonGroup>

      <ToggleButtonGroup onChange={handleChangeCta} value={selectedIndexCta}>
        <ToggleButton value={0} aria-label="alert" data-icon="notifications" />
        <ToggleButton aria-label="home" data-icon="home" value={1} />
        <ToggleButton aria-label="search" data-icon="search" value={2} />
        <ToggleButton aria-label="print" data-icon="print" value={3} />
      </ToggleButtonGroup>
    </div>
  );
};

ButtonGroupWithIconOnly.displaySequence = displaySequence++;
