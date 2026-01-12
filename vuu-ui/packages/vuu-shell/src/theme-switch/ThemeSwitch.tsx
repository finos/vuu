import cx from "clsx";
import { ToggleButton, ToggleButtonGroup, useControlled } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { HTMLAttributes, SyntheticEvent, useCallback } from "react";
import { ThemeMode } from "@vuu-ui/vuu-utils";

import themeSwitchCss from "./ThemeSwitch.css";

const classBase = "vuuThemeSwitch";
export interface ThemeSwitchProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  defaultMode?: ThemeMode;
  mode?: ThemeMode;
  onChange: (mode: ThemeMode) => void;
}

export const ThemeSwitch = ({
  className: classNameProp,
  defaultMode: defaultModeProp,
  mode: modeProp,
  onChange,
  ...htmlAttributes
}: ThemeSwitchProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-theme-switch",
    css: themeSwitchCss,
    window: targetWindow,
  });

  const [mode, setMode] = useControlled<ThemeMode>({
    controlled: modeProp,
    default: defaultModeProp ?? "light",
    name: "ThemeSwitch",
    state: "mode",
  });

  const handleChangeSecondary = useCallback(
    (evt: SyntheticEvent<HTMLButtonElement>) => {
      const { value } = evt.target as HTMLButtonElement;
      setMode(value as ThemeMode);
      onChange(value as ThemeMode);
    },
    [onChange, setMode],
  );
  const className = cx(classBase, classNameProp);
  return (
    <ToggleButtonGroup
      className={className}
      {...htmlAttributes}
      onChange={handleChangeSecondary}
      value={mode}
    >
      <ToggleButton aria-label="alert" data-icon="light" value="light" />
      <ToggleButton aria-label="home" data-icon="dark" value="dark" />
    </ToggleButtonGroup>
  );
};
