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
      <ToggleButton value="vuu-theme-deprecated">
        VUU (old version)
      </ToggleButton>
      <ToggleButton value="vuu-theme">VUU</ToggleButton>
      <ToggleButton value="vuu-theme-next">VUU Next</ToggleButton>
    </ToggleButtonGroup>
  );
};
