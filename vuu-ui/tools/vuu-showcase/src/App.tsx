import { TreeTable } from "@finos/vuu-datatable";
import { FlexboxLayout, LayoutProvider, View } from "@finos/vuu-layout";
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
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IFrame } from "./components";
import {
  ExamplesModule,
  byDisplaySequence,
  keysFromPath,
  loadTheme,
  pathFromKey,
} from "./showcase-utils";

import "./App.css";

const sourceFromImports = (
  stories: ExamplesModule,
  prefix = "",
  icon = "folder",
): TreeSourceNode[] =>
  Object.entries(stories)
    .filter(([path]) => path !== "default")
    .sort(byDisplaySequence)
    .map<TreeSourceNode>(([label, stories]) => {
      const id = `${prefix}${label}`;
      // TODO how can we know when a potential docs node has docs
      // console.log(`id=${id}`);
      if (typeof stories === "function") {
        return {
          id,
          icon: "rings",
          label,
        };
      }
      return {
        id,
        icon,
        label,
        childNodes: sourceFromImports(stories, `${id}/`, "box"),
      };
    });
export interface AppProps {
  stories: ExamplesModule;
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

export const App = ({ stories }: AppProps) => {
  const navigate = useNavigate();
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    loadTheme("vuu-theme").then(() => {
      setThemeReady(true);
    });
  }, []);

  // // TODO cache source in localStorage
  const source = useMemo(() => sourceFromImports(stories), [stories]);
  const { pathname } = useLocation();
  const handleChange: TableRowSelectHandler = (row) => {
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

  const handleThemeChange = useCallback((evt) => {
    const { value } = evt.target as HTMLInputElement;
    setThemeIndex(parseInt(value));
  }, []);

  const handleDensityChange = useCallback((evt) => {
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

  return themeReady ? (
    <SaltProvider density="high" theme="vuu-theme" mode="light">
      <LayoutProvider>
        <FlexboxLayout
          style={{ flexDirection: "column", width: "100vw", height: "100vh" }}
        >
          <div
            className="vuuToolbarProxy ShowcaseToolbar"
            style={{ height: 30 }}
          >
            <Text styleAs="h3">Vuu Showcase</Text>
          </div>
          <FlexboxLayout style={{ flexDirection: "row", flex: 1 }}>
            <View
              resizeable
              style={{ flexGrow: 0, flexShrink: 0, flexBasis: 200 }}
            >
              <TreeTable
                className="ShowcaseNav"
                data-resizeable
                rowHeight={30}
                defaultSelectedKeyValues={keysFromPath(pathname)}
                // selected={[pathname.slice(1)]}
                showColumnHeaders={false}
                onSelect={handleChange}
                revealSelected
                source={source}
                width="100%"
              />
            </View>
            <FlexboxLayout
              className="ShowcaseContentContainer"
              resizeable
              style={{ flexDirection: "column", flex: "1 1 auto" }}
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
            </FlexboxLayout>
          </FlexboxLayout>
        </FlexboxLayout>
      </LayoutProvider>
    </SaltProvider>
  ) : null;
};
