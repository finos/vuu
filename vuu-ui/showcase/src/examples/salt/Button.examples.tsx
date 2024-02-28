import { Button } from "@salt-ds/core";
import { CSSProperties } from "react";
import { Icon, IconButton } from "@finos/vuu-ui-controls";

let displaySequence = 1;

export const DefaultButton = () => {
  const handleClick = () => {
    console.log("Button click");
  };
  return (
    <Button data-showcase-center onClick={handleClick}>
      Button
    </Button>
  );
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
      <IconButton icon="filter" />
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
        justifyItems: "left",
      }}
    >
      <span />
      <span>Primary</span>
      <span>Secondary</span>
      <span>CTA</span>

      <span />
      <IconButton icon="filter" variant="primary" />
      <IconButton icon="filter" variant="secondary" />
      <IconButton icon="filter" variant="cta" />

      <span />
      <Button variant="primary">
        <Icon name="filter" />
        Filter
      </Button>
      <Button variant="secondary">
        <Icon name="filter" />
        Filter
      </Button>
      <Button variant="cta">
        <Icon name="filter" />
        Filter
      </Button>

      <span>active</span>
      <IconButton
        className="saltButton-active"
        icon="filter"
        variant="primary"
      />
      <IconButton
        className="saltButton-active"
        icon="filter"
        variant="secondary"
      />
      <IconButton className="saltButton-active" icon="filter" variant="cta" />

      <span>active</span>
      <Button className="saltButton-active" variant="primary">
        <Icon name="filter" />
        Filter
      </Button>
      <Button className="saltButton-active" variant="secondary">
        <Icon name="filter" />
        Filter
      </Button>
      <Button className="saltButton-active" variant="cta">
        <Icon name="filter" />
        Filter
      </Button>

      <span>disabled</span>
      <IconButton disabled icon="filter" variant="primary" />
      <IconButton disabled icon="filter" variant="secondary" />
      <IconButton disabled icon="filter" variant="cta" />

      <span>disabled</span>
      <Button disabled variant="primary">
        <Icon name="filter" />
        Filter
      </Button>
      <Button disabled variant="secondary">
        <Icon name="filter" />
        Filter
      </Button>
      <Button disabled variant="cta">
        <Icon name="filter" />
        Filter
      </Button>
    </div>
  );
};
ButtonVariations.displaySequence = displaySequence++;
