import React, { SyntheticEvent, useCallback } from "react";
import { ThemeSwitch } from "@vuu-ui/vuu-shell";
import { Button, ToggleButton, ToggleButtonGroup } from "@salt-ds/core";
import type { HostMode } from "../shared-utils";
import { Density, useShowcaseContext } from "./ShowcaseProvider";
import { ThemePicker } from "./theme-picker/ThemePicker";
import { DataSourcePicker } from "./data-source-picker/DataSourcePicker";

export const ContentToolbar = () => {
  const {
    dataConsumer,
    dataLocation,
    density,
    hostMode,
    onChangeDensity,
    onChangeDataLocation,
    onChangeHostMode,
    onChangeTheme,
    onChangeThemeMode,
    theme,
    themeMode,
  } = useShowcaseContext();

  const launchStandaloneWindow = useCallback(() => {
    const hostParam = hostMode ? `,host=${hostMode}` : "";
    window.open(
      `${location.href}?standalone&theme=${theme}#themeMode=${themeMode},density=${density},dataLocation=${dataLocation}${hostParam}`,
      "_blank",
    );
  }, [dataLocation, density, hostMode, theme, themeMode]);

  const handleHostModeChange = useCallback(
    (evt: SyntheticEvent) => {
      const { value } = evt.target as HTMLInputElement;
      onChangeHostMode(value as HostMode);
    },
    [onChangeHostMode],
  );

  const handleDensityChange = useCallback(
    (evt: SyntheticEvent) => {
      const { value } = evt.target as HTMLInputElement;
      onChangeDensity(value as Density);
    },
    [onChangeDensity],
  );

  return (
    <div
      className="vuuToolbarProxy ShowcaseContentToolbar"
      style={{
        height: 30,
      }}
      data-mode="light"
    >
      <ThemePicker theme={theme} onChange={onChangeTheme} />

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

      {hostMode ? (
        <ToggleButtonGroup
          aria-label="Host example"
          className="vuuToggleButtonGroup"
          data-variant="primary"
          onChange={handleHostModeChange}
          value={hostMode}
        >
          <ToggleButton value="component">Component</ToggleButton>
          <ToggleButton value="portal">Portal</ToggleButton>
        </ToggleButtonGroup>
      ) : null}

      {dataConsumer ? (
        <DataSourcePicker
          dataLocation={dataLocation}
          onDataLocationChange={onChangeDataLocation}
        />
      ) : null}

      <Button
        appearance="transparent"
        data-align="end"
        data-icon="open-in"
        onClick={launchStandaloneWindow}
        sentiment="neutral"
      />
    </div>
  );
};
