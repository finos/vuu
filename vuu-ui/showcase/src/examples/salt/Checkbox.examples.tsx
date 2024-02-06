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
