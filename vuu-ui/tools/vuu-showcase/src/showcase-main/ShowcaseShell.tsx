import {
  GridLayout,
  GridLayoutChangeHandler,
  GridLayoutItem,
  GridLayoutProvider,
} from "@heswell/grid-layout";

import { ThemeSwitch } from "@finos/vuu-shell";
import type { TableRowSelectHandler } from "@finos/vuu-table-types";
import type { Density, ThemeMode, TreeSourceNode } from "@finos/vuu-utils";
import {
  Button,
  SaltProvider,
  Text,
  ToggleButton,
  ToggleButtonGroup,
} from "@salt-ds/core";
import React, {
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { keysFromPath, loadTheme, pathFromKey } from "../shared-utils";
import { IFrame } from "./iframe";
import { TreeNavPanel } from "./tree-nav/TreeNavPanel";

import "./ShowcaseShell.css";

export interface AppProps {
  treeSource: TreeSourceNode[];
}

type ThemeDescriptor = { label?: string; id: string };
type ThemeModeDescriptor = { label?: string; id: ThemeMode };
type DensityDescriptor = { label?: string; id: Density };

const availableThemes: ThemeDescriptor[] = [
  { id: "no-theme", label: "No Theme" },
  { id: "salt-theme", label: "Salt" },
  { id: "vuu-theme", label: "Vuu" },
  { id: "tar-theme", label: "Tar" },
];

const availableThemeModes: ThemeModeDescriptor[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

const availableDensity: DensityDescriptor[] = [
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
  { id: "touch", label: "Touch" },
];

export const ShowcaseShell = ({ treeSource }: AppProps) => {
  const navigate = useNavigate();
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    loadTheme("vuu-theme").then(() => {
      setThemeReady(true);
    });
  }, []);

  // // TODO cache source in localStorage
  const { pathname } = useLocation();
  const handleSelect: TableRowSelectHandler = (row) => {
    if (row) {
      const path = pathFromKey(row.key);
      navigate(path);
    }
  };
  const [themeIndex, setThemeIndex] = useState(2);
  const [themeModeIndex, setThemeModeIndex] = useState(0);
  const [densityIndex, setDensityIndex] = useState(0);

  const theme = useMemo(() => availableThemes[themeIndex], [themeIndex]);
  const themeMode = useMemo(
    () => availableThemeModes[themeModeIndex],
    [themeModeIndex],
  );
  const density = useMemo(() => availableDensity[densityIndex], [densityIndex]);

  const launchStandaloneWindow = useCallback(() => {
    window.open(
      `${location.href}?standalone&theme=${theme.id}#themeMode=${themeMode.id},density=${density.id}`,
      "_blank",
    );
  }, [density.id, theme.id, themeMode.id]);

  const handleThemeChange = useCallback((evt: SyntheticEvent) => {
    const { value } = evt.target as HTMLInputElement;
    setThemeIndex(parseInt(value));
  }, []);

  const handleDensityChange = useCallback((evt: SyntheticEvent) => {
    const { value } = evt.target as HTMLInputElement;
    setDensityIndex(parseInt(value));
  }, []);

  const handleThemeModeSwitch = useCallback((themeMode: ThemeMode) => {
    if (themeMode === "light") {
      setThemeModeIndex(0);
    } else {
      setThemeModeIndex(1);
    }
  }, []);

  const handleGridLayoutChanged = useCallback<GridLayoutChangeHandler>(
    (gridId, gridLayoutDescriptor) => {
      console.log(`[ShowcaseShell] Grid layout changed ${gridId}`, {
        gridLayoutDescriptor,
      });
    },
    [],
  );

  return themeReady ? (
    <SaltProvider density="high" theme="vuu-theme" mode="light">
      <GridLayoutProvider>
        <GridLayout
          colsAndRows={{
            cols: ["200px", "1fr"],
            rows: ["48px", "40px", "1fr"],
          }}
          full-page
          id="ShowcaseShell"
          onChange={handleGridLayoutChanged}
        >
          {/* ------ App Header -------*/}
          <GridLayoutItem
            id="app-header"
            style={{
              gridArea: "1/1/2/3",
            }}
          >
            <div
              className="vuuToolbarProxy ShowcaseToolbar"
              style={{ height: 30 }}
            >
              <Text styleAs="h3">Vuu Showcase</Text>
            </div>
          </GridLayoutItem>

          {/* ------ Left Nav -------*/}
          <GridLayoutItem
            id="palette"
            resizeable="hv"
            style={{
              gridArea: "2/1/4/2",
            }}
          >
            <TreeNavPanel
              className="ShowcaseNav"
              defaultSelectedKeyValues={keysFromPath(pathname)}
              onSelect={handleSelect}
              resizeable
              source={treeSource}
              style={{ flexGrow: 0, flexShrink: 0, flexBasis: 200 }}
            />
          </GridLayoutItem>

          {/* ------ App Toolbar -------*/}
          <GridLayoutItem
            id="app-toolbar"
            resizeable="h"
            style={{
              gridArea: "2/2/3/3",
            }}
          >
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
                value={themeIndex}
              >
                <ToggleButton value={0}>No Theme</ToggleButton>
                <ToggleButton value={1}>SALT</ToggleButton>
                <ToggleButton value={2}>VUU</ToggleButton>
                <ToggleButton value={3}>TAR</ToggleButton>
              </ToggleButtonGroup>

              <ThemeSwitch
                className="vuuToggleButtonGroup"
                data-variant="primary"
                onChange={handleThemeModeSwitch}
              ></ThemeSwitch>

              <ToggleButtonGroup
                className="vuuToggleButtonGroup"
                data-variant="primary"
                onChange={handleDensityChange}
                value={densityIndex}
              >
                <ToggleButton value={0}>High</ToggleButton>
                <ToggleButton value={1}>Medium</ToggleButton>
                <ToggleButton value={2}>Low</ToggleButton>
                <ToggleButton value={3}>Touch</ToggleButton>
              </ToggleButtonGroup>

              <Button
                data-align="end"
                data-icon="open-in"
                onClick={launchStandaloneWindow}
                variant="secondary"
              />
            </div>
          </GridLayoutItem>

          {/* ------ Content Container -------*/}
          <GridLayoutItem
            id="LayoutBrown"
            style={{ gridArea: "3/2/4/3" }}
            title="Brown Layout"
          >
            <div
              className={`ShowcaseContent`}
              style={{
                flex: "1 1 auto",
                position: "relative",
              }}
            >
              <IFrame
                theme={theme.id}
                themeMode={themeMode.id}
                density={density.id}
              />
            </div>
          </GridLayoutItem>
        </GridLayout>
      </GridLayoutProvider>
    </SaltProvider>
  ) : null;
};
