import { ToggleButton, ToggleButtonGroup } from "@salt-ds/core";
import { SyntheticEvent, useCallback } from "react";

export interface ThemePickerProps {
  onChange: (theme: string) => void;
  theme: string;
}

export const ThemePicker = ({ onChange, theme }: ThemePickerProps) => {
  const handleChange = useCallback(
    (e: SyntheticEvent) => {
      const { value } = e.target as HTMLInputElement;
      onChange(value);
    },
    [onChange],
  );

  return (
    <ToggleButtonGroup
      className="vuuToggleButtonGroup"
      data-variant="primary"
      onChange={handleChange}
      value={theme}
    >
      <ToggleButton value="no-theme">No Theme</ToggleButton>
      <ToggleButton value="salt-theme">SALT</ToggleButton>
      <ToggleButton value="salt-theme-next">SALT Next</ToggleButton>
      <ToggleButton value="vuu-theme">VUU</ToggleButton>
      <ToggleButton value="vuu2-theme">VUU2</ToggleButton>
      <ToggleButton value="vuu2-theme-next">VUU2 Next</ToggleButton>
    </ToggleButtonGroup>
  );
};
