import cx from "classnames";
import { ToggleButton, ToggleButtonGroup, useControlled } from "@salt-ds/core";
import { HTMLAttributes, useCallback } from "react";

import "./ThemeSwitch.css";
import { ThemeMode } from "../theme-provider";

const classBase = "vuuThemeSwitch";
export interface ThemeSwitchProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  defaultMode?: ThemeMode;
  mode?: ThemeMode;
  onChange: (mode: ThemeMode) => void;
}

const modes: ThemeMode[] = ["light", "dark"];

export const ThemeSwitch = ({
  className: classNameProp,
  defaultMode: defaultModeProp,
  mode: modeProp,
  onChange,
  ...htmlAttributes
}: ThemeSwitchProps) => {
  const [mode, setMode] = useControlled<ThemeMode>({
    controlled: modeProp,
    default: defaultModeProp ?? "light",
    name: "ThemeSwitch",
    state: "mode",
  });

  const selectedIndex = modes.indexOf(mode);

  const handleChangeSecondary = useCallback(
    (_evt) => {
      const mode = modes[index];
      setMode(mode);
      onChange(mode);
    },
    [onChange, setMode]
  );
  const className = cx(classBase, classNameProp);
  return (
    <ToggleButtonGroup
      className={className}
      {...htmlAttributes}
      onChange={handleChangeSecondary}
    >
      <ToggleButton aria-label="alert" data-icon="light" value="dark" />
      <ToggleButton aria-label="home" data-icon="dark" value="light" />
    </ToggleButtonGroup>
  );
};
