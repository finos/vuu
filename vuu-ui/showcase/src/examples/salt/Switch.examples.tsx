// import { ComponentAnatomy } from '@heswell/component-anatomy';
import { Switch, SwitchProps } from "@salt-ds/core";
import { ChangeEvent, useState } from "react";

let displaySequence = 1;

export const DefaultSwitch = ({
  label = "Default",
  ...props
}: Partial<SwitchProps>) => {
  return <Switch data-showcase-center {...props} label={label} />;
};
DefaultSwitch.displaySequence = displaySequence++;

export const CheckedSwitch = () => {
  return <DefaultSwitch checked label="Checked Switch" />;
};
CheckedSwitch.displaySequence = displaySequence++;

export const DisabledSwitch = () => {
  return <DefaultSwitch label="Disabled Switch" disabled />;
};
DisabledSwitch.displaySequence = displaySequence++;

export const DisabledCheckedSwitch = () => {
  return <DefaultSwitch checked label="Disabled + Checked" disabled />;
};
DisabledCheckedSwitch.displaySequence = displaySequence++;

export const ControlledSwitch = () => {
  const [checked, setChecked] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setChecked(event.target.checked);
  };

  return <DefaultSwitch checked={checked} onChange={handleChange} />;
};
ControlledSwitch.displaySequence = displaySequence++;
