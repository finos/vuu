import {
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupChangeEventHandler,
} from "@heswell/salt-lab";
import cx from "classnames";
import { useControlled } from "@salt-ds/core";
import { HTMLAttributes, useCallback } from "react";

import "./ThemeSwitch.css";
import { ThemeMode } from "../theme-provider";

const classBase = "vuuThemeSwitch";
export interface ThemeSwitchProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  defaultMode?: ThemeMode;
  mode?: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
}

const modes: ThemeMode[] = ["light", "dark"];

export const ThemeSwitch = ({
  className: classNameProp,
  defaultMode: defaultModeProp,
  mode: modeProp,
  onThemeModeChange,
  ...htmlAttributes
}: ThemeSwitchProps) => {
  const [mode, setMode] = useControlled<ThemeMode>({
    controlled: modeProp,
    default: defaultModeProp ?? "light",
    name: "ThemeSwitch",
    state: "mode",
  });

  const selectedIndex = modes.indexOf(mode);

  const handleChangeSecondary: ToggleButtonGroupChangeEventHandler =
    useCallback(
      (_evt, index) => {
        const mode = modes[index];
        setMode(mode);
        onThemeModeChange(mode);
      },
      [onThemeModeChange, setMode]
    );
  const className = cx(classBase, classNameProp);
  return (
    <ToggleButtonGroup
      className={className}
      {...htmlAttributes}
      onChange={handleChangeSecondary}
      selectedIndex={selectedIndex}
    >
      <ToggleButton
        aria-label="alert"
        tooltipText="Light Theme"
        data-icon="light"
      />
      <ToggleButton
        aria-label="home"
        tooltipText="Dark Theme"
        data-icon="dark"
      />
    </ToggleButtonGroup>
  );
};
