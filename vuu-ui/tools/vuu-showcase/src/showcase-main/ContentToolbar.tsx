import React, { SyntheticEvent, useCallback } from "react";
import { ThemeSwitch } from "@vuu-ui/vuu-shell";
import { Button, ToggleButton, ToggleButtonGroup } from "@salt-ds/core";
import { DataLocation, Density, useShowcaseContext } from "./ShowcaseProvider";

export const ContentToolbar = () => {
  const {
    dataConsumer,
    dataLocation,
    density,
    onChangeDensity,
    onChangeDataLocation,
    onChangeTheme,
    onChangeThemeMode,
    theme,
    themeMode,
  } = useShowcaseContext();

  const launchStandaloneWindow = useCallback(() => {
    window.open(
      `${location.href}?standalone&theme=${theme}#themeMode=${themeMode},density=${density},dataLocation=${dataLocation}`,
      "_blank",
    );
  }, [dataLocation, density, theme, themeMode]);

  const handleThemeChange = useCallback(
    (evt: SyntheticEvent) => {
      const { value } = evt.target as HTMLInputElement;
      onChangeTheme(value);
    },
    [onChangeTheme],
  );

  const handleDensityChange = useCallback(
    (evt: SyntheticEvent) => {
      const { value } = evt.target as HTMLInputElement;
      onChangeDensity(value as Density);
    },
    [onChangeDensity],
  );

  const handleDataLocationChange = useCallback(
    (evt: SyntheticEvent) => {
      const { value } = evt.target as HTMLInputElement;
      onChangeDataLocation(value as DataLocation);
    },
    [onChangeDataLocation],
  );

  return (
    <div
      className="vuuToolbarProxy ShowcaseContentToolbar"
      style={{
        height: 30,
      }}
      data-mode="light"
    >
      <ToggleButtonGroup
        className="vuuToggleButtonGroup"
        data-variant="primary"
        onChange={handleThemeChange}
        value={theme}
      >
        <ToggleButton value="no-theme">No Theme</ToggleButton>
        <ToggleButton value="salt-theme">SALT</ToggleButton>
        <ToggleButton value="vuu-theme">VUU</ToggleButton>
      </ToggleButtonGroup>

      <ThemeSwitch
        className="vuuToggleButtonGroup"
        data-variant="primary"
        onChange={onChangeThemeMode}
      ></ThemeSwitch>

      <ToggleButtonGroup
        className="vuuToggleButtonGroup"
        data-variant="primary"
        onChange={handleDensityChange}
        value={density}
      >
        <ToggleButton value="high">High</ToggleButton>
        <ToggleButton value="medium">Medium</ToggleButton>
        <ToggleButton value="low">Low</ToggleButton>
        <ToggleButton value="touch">Touch</ToggleButton>
      </ToggleButtonGroup>

      {dataConsumer ? (
        <ToggleButtonGroup
          className="vuuToggleButtonGroup"
          data-variant="primary"
          onChange={handleDataLocationChange}
          value={dataLocation}
        >
          <ToggleButton value="local">Local Data</ToggleButton>
          <ToggleButton value="remote">Remote Data</ToggleButton>
        </ToggleButtonGroup>
      ) : null}

      <Button
        data-align="end"
        data-icon="open-in"
        onClick={launchStandaloneWindow}
        variant="secondary"
      />
    </div>
  );
};
