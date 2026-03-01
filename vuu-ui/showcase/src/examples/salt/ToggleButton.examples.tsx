import {
  ButtonProps,
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupProps,
} from "@salt-ds/core";
import { Icon } from "@vuu-ui/vuu-ui-controls";
import { SyntheticEvent, useState } from "react";

import "./ToggleButton.examples.css";

interface ToggleButtonExampleProps
  extends Pick<ToggleButtonGroupProps, "sentiment"> {
  "data-variant"?: ButtonProps["variant"];
  "data-accented"?: boolean;
}

export const ButtonGroupWithTextOnly = (props: ToggleButtonExampleProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(1);

  const handleChange = (evt: SyntheticEvent<HTMLButtonElement>) => {
    setSelectedIndex(parseInt((evt.target as HTMLButtonElement).value));
  };

  return (
    <ToggleButtonGroup
      {...props}
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

export const ButtonGroupWithIconOnly = (props: ToggleButtonExampleProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(1);

  const handleChange = (evt: SyntheticEvent<HTMLElement>) => {
    const target = evt.target as HTMLElement;
    const button = target?.closest("button");
    if (button) {
      setSelectedIndex(parseInt(button.value));
    }
  };

  return (
    <ToggleButtonGroup
      {...props}
      className="vuuToggleButtonExample"
      data-showcase-center
      onChange={handleChange}
      value={selectedIndex}
    >
      <ToggleButton
        className="vuuIconToggleButton"
        value={0}
        aria-label="alert"
      >
        <Icon name="notifications" />
      </ToggleButton>
      <ToggleButton className="vuuIconToggleButton" value={1} aria-label="home">
        <Icon name="home" />
      </ToggleButton>
      <ToggleButton
        className="vuuIconToggleButton"
        value={2}
        aria-label="search"
      >
        <Icon name="search" size={16} />
      </ToggleButton>
      <ToggleButton
        className="vuuIconToggleButton"
        value={3}
        aria-label="print"
      >
        <Icon name="print" />
      </ToggleButton>
    </ToggleButtonGroup>
  );
};

export const ButtonGroupWithTextAndIcon = (props: ToggleButtonExampleProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(1);

  const handleChange = (evt: SyntheticEvent<HTMLElement>) => {
    const target = evt.target as HTMLElement;
    const button = target?.closest("button");
    if (button) {
      setSelectedIndex(parseInt(button.value));
    }
  };

  return (
    <ToggleButtonGroup
      {...props}
      className="vuuToggleButtonExample"
      onChange={handleChange}
      value={selectedIndex}
    >
      <ToggleButton value={0} aria-label="alert">
        <span>Notifications</span>
        <Icon name="notifications" />
      </ToggleButton>
      <ToggleButton value={1} aria-label="home">
        <span>Home</span>
        <Icon name="home" />
      </ToggleButton>
      <ToggleButton value={2} aria-label="search">
        <span>Search</span>
        <Icon name="search" />
      </ToggleButton>
      <ToggleButton value={3} aria-label="print">
        <span>Print</span>
        <Icon name="print" />
      </ToggleButton>
    </ToggleButtonGroup>
  );
};

export const ToggleButtonGroupVariations = () => {
  return (
    <div
      className="vuuToggleButtonExample"
      // data-showcase-center
      style={{
        alignItems: "center",
        display: "grid",
        columnGap: 20,
        rowGap: 12,
        gridTemplateColumns: "auto 1fr",
        gridTemplateRows: "40px 40px 40px 40px 40px 40px 40px 40px 40px",
        justifyItems: "start",
      }}
    >
      <span>CTA (Accented)</span>
      <ButtonGroupWithTextOnly sentiment="accented" />

      <span />
      <ButtonGroupWithIconOnly sentiment="accented" />

      <span />
      <ButtonGroupWithTextAndIcon sentiment="accented" />

      <span>Primary (Neutral)</span>
      <ButtonGroupWithTextOnly />

      <span />
      <ButtonGroupWithIconOnly />

      <span />
      <ButtonGroupWithTextAndIcon />

      <span>Borderless (Neutral)</span>
      <ButtonGroupWithTextOnly data-borderless />

      <span />
      <ButtonGroupWithIconOnly data-borderless />

      <span />
      <ButtonGroupWithTextAndIcon data-borderless />
    </div>
  );
};

export const SingleToggleButton = () => {
  return (
    <ToggleButton data-showcase-center data-variant="primary" value="test-1">
      Test
    </ToggleButton>
  );
};
