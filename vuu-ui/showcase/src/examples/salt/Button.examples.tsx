import { Button } from "@salt-ds/core";
import { Switch } from "@salt-ds/lab";
import { CSSProperties } from "react";

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
      <Button data-icon="filter">Filter</Button>
    </div>
  );
};
IconButtons.displaySequence = displaySequence++;

export const DefaultSwitch = () => {
  return <Switch label="xyz" checked={false} />;
};
