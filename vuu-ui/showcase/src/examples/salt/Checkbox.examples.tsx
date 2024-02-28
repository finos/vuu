import { Checkbox, SwitchProps } from "@salt-ds/core";
import { ChangeEvent, useState } from "react";

let displaySequence = 1;

export const DefaultCheckbox = ({
  label = "Default",
  ...props
}: Partial<SwitchProps>) => {
  return <Checkbox data-showcase-center {...props} label={label} />;
};
DefaultCheckbox.displaySequence = displaySequence++;

export const CheckedSwitch = () => {
  return <DefaultCheckbox checked label="Checked Checkbox" />;
};
CheckedSwitch.displaySequence = displaySequence++;

export const DisabledCheckbox = () => {
  return <DefaultCheckbox label="Disabled Checkbox" disabled />;
};
DisabledCheckbox.displaySequence = displaySequence++;

export const DisabledCheckedCheckbox = () => {
  return <DefaultCheckbox checked label="Disabled + Checked" disabled />;
};
DisabledCheckedCheckbox.displaySequence = displaySequence++;

export const ControlledCheckbox = () => {
  const [checked, setChecked] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setChecked(event.target.checked);
  };

  return <DefaultCheckbox checked={checked} onChange={handleChange} />;
};
ControlledCheckbox.displaySequence = displaySequence++;

export const CheckboxVariations = () => {
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
      <span>Success</span>
      <span>Warning</span>
      <span>Error</span>

      <span>Default</span>
      <Checkbox data-showcase-center validationStatus="success" />
      <Checkbox data-showcase-center validationStatus="warning" />
      <Checkbox data-showcase-center validationStatus="error" />

      <span>Checked</span>
      <Checkbox checked label="Checked Checkbox" validationStatus="success" />
      <Checkbox checked label="Checked Checkbox" validationStatus="warning" />
      <Checkbox checked label="Checked Checkbox" validationStatus="error" />

      <span>Disabled</span>
      <Checkbox label="Disabled Checkbox" disabled validationStatus="success" />
      <Checkbox label="Disabled Checkbox" disabled validationStatus="warning" />
      <Checkbox label="Disabled Checkbox" disabled validationStatus="error" />

      <span>Disabled Checked</span>
      <Checkbox checked label="Disabled + Checked" disabled validationStatus="success" />
      <Checkbox checked label="Disabled + Checked" disabled validationStatus="warning" />
      <Checkbox checked label="Disabled + Checked" disabled validationStatus="error" />
    </div>
  );
};
CheckboxVariations.displaySequence = displaySequence++;
