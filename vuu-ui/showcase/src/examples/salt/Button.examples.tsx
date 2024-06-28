import { Button } from "@salt-ds/core";
import { CSSProperties } from "react";
import { Icon, IconButton } from "@finos/vuu-ui-controls";

let displaySequence = 1;

export const ButtonTextOnly = () => {
  const handleClick = () => {
    console.log("Button click");
  };
  return (
    <Button data-showcase-center onClick={handleClick}>
      Button
    </Button>
  );
};
ButtonTextOnly.displaySequence = displaySequence++;

export const ButtonIconOnly = () => {
  const handleClick = () => {
    console.log("Button click");
  };
  return (
    <IconButton data-showcase-center icon="filter" onClick={handleClick} />
  );
};
ButtonIconOnly.displaySequence = displaySequence++;

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
        gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
        justifyItems: "left",
      }}
    >
      <span />
      <span>CTA</span>
      <span>Primary</span>
      <span>Secondary</span>
      <span>Embedded</span>

      <span />
      <IconButton icon="filter" variant="cta" />
      <IconButton icon="filter" variant="primary" />
      <IconButton icon="filter" variant="secondary" />
      <IconButton icon="filter" data-embedded variant="secondary" />

      <span />
      <Button variant="cta">
        <Icon name="filter" />
        Filter
      </Button>
      <Button variant="primary">
        <Icon name="filter" />
        Filter
      </Button>
      <Button variant="secondary">
        <Icon name="filter" />
        Filter
      </Button>
      <Button data-embedded variant="secondary">
        <Icon name="filter" />
        Filter
      </Button>

      <span>active</span>
      <IconButton className="saltButton-active" icon="filter" variant="cta" />
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
      <IconButton
        className="saltButton-active"
        data-embedded
        icon="filter"
        variant="secondary"
      />

      <span>active</span>
      <Button className="saltButton-active" variant="cta">
        <Icon name="filter" />
        Filter
      </Button>
      <Button className="saltButton-active" variant="primary">
        <Icon name="filter" />
        Filter
      </Button>
      <Button className="saltButton-active" variant="secondary">
        <Icon name="filter" />
        Filter
      </Button>
      <Button className="saltButton-active" data-embedded variant="secondary">
        <Icon name="filter" />
        Filter
      </Button>

      <span>disabled</span>
      <IconButton disabled icon="filter" variant="cta" />
      <IconButton disabled icon="filter" variant="primary" />
      <IconButton disabled icon="filter" variant="secondary" />
      <IconButton disabled data-embedded icon="filter" variant="secondary" />

      <span>disabled</span>
      <Button disabled variant="cta">
        <Icon name="filter" />
        Filter
      </Button>
      <Button disabled variant="primary">
        <Icon name="filter" />
        Filter
      </Button>
      <Button disabled variant="secondary">
        <Icon name="filter" />
        Filter
      </Button>
      <Button disabled data-embedded variant="secondary">
        <Icon name="filter" />
        Filter
      </Button>
    </div>
  );
};
ButtonVariations.displaySequence = displaySequence++;
