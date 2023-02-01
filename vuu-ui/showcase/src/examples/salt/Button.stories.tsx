import { Button } from "@salt-ds/core";

export const DefaultButton = () => {
  const handleClick = () => {
    console.log("Button click");
  };
  return <Button onClick={handleClick}>Button</Button>;
};

export const IconButtons = () => {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        "--vuu-icon-size": "12px",
      }}
    >
      <Button data-icon="filter" />
      <Button data-icon="filter">Filter</Button>
    </div>
  );
};
