import { Button } from "@salt-ds/core";
import { CSSProperties } from "react";
import { Icon } from "@finos/vuu-icons";

let displaySequence = 1;

export const DefaultButton = () => {
  const handleClick = () => {
    console.log("Button click");
  };
  return <Button onClick={handleClick}>Button</Button>;
};
DefaultButton.displaySequence = displaySequence++;

export const IconButtons = () => {
  return (
    <div
      style={
        {
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          "--vuu-icon-size": "12px",
        } as CSSProperties
      }
    >
      <Button data-icon="filter" />
      <Button>
        <Icon name="filter" />
      </Button>
      <Button>
        <Icon name="filter" />
        Filter
      </Button>
      <Button>
        Filter
        <Icon name="filter" />
      </Button>
    </div>
  );
};
IconButtons.displaySequence = displaySequence++;

export const ButtonVariations = () => {
  return (
    <div
      data-showcase-center
      style={{
        alignItems: "center",
        display: "grid",
        gap: 20,
        gridTemplateColumns: "1fr 1fr 1fr 1fr",
        gridTemplateRows: "1fr 1fr 1fr",
        justifyItems: "center",
      }}
    >
      <span />
      <span>Primary</span>
      <span>Secondary</span>
      <span>CTA</span>

      <span />
      <Button data-icon="filter" variant="primary" />
      <Button data-icon="filter" variant="secondary" />
      <Button data-icon="filter" variant="cta" />

      <span />
      <Button data-icon="filter" variant="primary">
        Filter
      </Button>
      <Button data-icon="filter" variant="secondary">
        Filter
      </Button>
      <Button data-icon="filter" variant="cta">
        Filter
      </Button>

      <span>active</span>
      <Button
        className="saltButton-active"
        data-icon="filter"
        variant="primary"
      />
      <Button
        className="saltButton-active"
        data-icon="filter"
        variant="secondary"
      />
      <Button className="saltButton-active" data-icon="filter" variant="cta" />

      <span>active</span>
      <Button
        className="saltButton-active"
        data-icon="filter"
        variant="primary"
      >
        Filter
      </Button>
      <Button
        className="saltButton-active"
        data-icon="filter"
        variant="secondary"
      >
        Filter
      </Button>
      <Button className="saltButton-active" data-icon="filter" variant="cta">
        Filter
      </Button>

      <span>disabled</span>
      <Button data-icon="filter" disabled variant="primary" />
      <Button data-icon="filter" disabled variant="secondary" />
      <Button data-icon="filter" disabled variant="cta" />

      <span>disabled</span>
      <Button data-icon="filter" disabled variant="primary">
        Filter
      </Button>
      <Button data-icon="filter" disabled variant="secondary">
        Filter
      </Button>
      <Button data-icon="filter" disabled variant="cta">
        Filter
      </Button>
    </div>
  );
};
ButtonVariations.displaySequence = displaySequence++;
