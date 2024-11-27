import { Switch, SwitchProps } from "@salt-ds/core";
import { ChangeEvent, useState } from "react";

export const DefaultSwitch = ({
  label = "Default",
  ...props
}: Partial<SwitchProps>) => {
  return <Switch data-showcase-center {...props} label={label} />;
};

export const CheckedSwitch = () => {
  return <DefaultSwitch checked label="Checked Switch" />;
};

export const DisabledSwitch = () => {
  return <DefaultSwitch label="Disabled Switch" disabled />;
};

export const DisabledCheckedSwitch = () => {
  return <DefaultSwitch checked label="Disabled + Checked" disabled />;
};

export const ControlledSwitch = () => {
  const [checked, setChecked] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setChecked(event.target.checked);
  };

  return <DefaultSwitch checked={checked} onChange={handleChange} />;
};
