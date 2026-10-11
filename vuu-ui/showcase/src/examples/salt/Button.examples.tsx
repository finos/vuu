import { Button } from "@salt-ds/core";
import { CSSProperties } from "react";
import { Icon, IconButton } from "@vuu-ui/vuu-ui-controls";

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
      <span>Accented/Solid (CTA)</span>
      <span>Neutral/Solid (Primary)</span>
      <span>Neutral/transparent (Secondary)</span>
      <span>Embedded</span>

      <span />
      <IconButton icon="filter" appearance="solid" sentiment="accented" />
      <IconButton icon="filter" appearance="solid" sentiment="neutral" />
      <IconButton icon="filter" appearance="transparent" sentiment="neutral" />
      <IconButton
        icon="filter"
        data-embedded
        appearance="transparent"
        sentiment="neutral"
      />

      <span />
      <Button appearance="solid" sentiment="accented">
        <Icon name="filter" />
        Filter
      </Button>
      <Button appearance="solid" sentiment="neutral">
        <Icon name="filter" />
        Filter
      </Button>
      <Button appearance="transparent" sentiment="neutral">
        <Icon name="filter" />
        Filter
      </Button>
      <Button data-embedded appearance="transparent" sentiment="neutral">
        <Icon name="filter" />
        Filter
      </Button>

      <span>active</span>
      <IconButton
        className="saltButton-active"
        icon="filter"
        appearance="solid"
        sentiment="accented"
      />
      <IconButton
        className="saltButton-active"
        icon="filter"
        appearance="solid"
        sentiment="neutral"
      />
      <IconButton
        className="saltButton-active"
        icon="filter"
        appearance="transparent"
        sentiment="neutral"
      />
      <IconButton
        className="saltButton-active"
        data-embedded
        icon="filter"
        appearance="transparent"
        sentiment="neutral"
      />

      <span>active</span>
      <Button
        className="saltButton-active"
        appearance="solid"
        sentiment="accented"
      >
        <Icon name="filter" />
        Filter
      </Button>
      <Button
        className="saltButton-active"
        appearance="solid"
        sentiment="neutral"
      >
        <Icon name="filter" />
        Filter
      </Button>
      <Button
        className="saltButton-active"
        appearance="transparent"
        sentiment="neutral"
      >
        <Icon name="filter" />
        Filter
      </Button>
      <Button
        className="saltButton-active"
        data-embedded
        appearance="transparent"
        sentiment="neutral"
      >
        <Icon name="filter" />
        Filter
      </Button>

      <span>disabled</span>
      <IconButton
        disabled
        icon="filter"
        appearance="solid"
        sentiment="accented"
      />
      <IconButton
        disabled
        icon="filter"
        appearance="solid"
        sentiment="neutral"
      />
      <IconButton
        disabled
        icon="filter"
        appearance="transparent"
        sentiment="neutral"
      />
      <IconButton
        disabled
        data-embedded
        icon="filter"
        appearance="transparent"
        sentiment="neutral"
      />

      <span>disabled</span>
      <Button disabled appearance="solid" sentiment="accented">
        <Icon name="filter" />
        Filter
      </Button>
      <Button disabled appearance="solid" sentiment="neutral">
        <Icon name="filter" />
        Filter
      </Button>
      <Button disabled appearance="transparent" sentiment="neutral">
        <Icon name="filter" />
        Filter
      </Button>
      <Button
        disabled
        data-embedded
        appearance="transparent"
        sentiment="neutral"
      >
        <Icon name="filter" />
        Filter
      </Button>
    </div>
  );
};
