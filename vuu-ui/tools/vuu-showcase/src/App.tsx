import { Flexbox } from "@finos/vuu-layout";
import { Tree, TreeSourceNode } from "@finos/vuu-ui-controls";
import { Density, ThemeMode, ThemeProvider } from "@finos/vuu-utils";
import { Button, Text, ToggleButton, ToggleButtonGroup } from "@salt-ds/core";
import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IFrame } from "./components";
import { byDisplaySequence, ExamplesModule } from "./showcase-utils";

import "./App.css";

const sourceFromImports = (
  stories: ExamplesModule,
  prefix = "",
  icon = "folder"
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
  { id: "salt", label: "Salt" },
  { id: "vuu", label: "Vuu" },
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
  console.log({ stories });
  const navigate = useNavigate();
  // // TODO cache source in localStorage
  const source = useMemo(() => sourceFromImports(stories), [stories]);
  const { pathname } = useLocation();
  const handleChange = ([selected]: TreeSourceNode[]) => navigate(selected.id);
  const [themeIndex, setThemeIndex] = useState(2);
  //const [themeMode] = useState<ThemeMode>("light");
  //const [density] = useState<Density>("high");
  const [themeModeIndex, setThemeModeIndex] = useState(0);
  const [densityIndex, setDensityIndex] = useState(0);

  const theme = useMemo(() => availableThemes[themeIndex], [themeIndex]);
  const themeMode = useMemo(() => availableThemeModes[themeModeIndex], [themeModeIndex]);
  const density = useMemo(() => availableDensity[densityIndex], [densityIndex]);

  const launchStandaloneWindow = useCallback(() => {
    window.open(`${location.href}?standalone&theme=${theme.id}`, "_blank");
  }, [theme.id]);

  const handleThemeChange = useCallback((evt) => {
    const { value } = evt.target as HTMLInputElement;
    setThemeIndex(parseInt(value));
  }, []);

  const handleThemeModeChange = useCallback((evt) => {
    const { value } = evt.target as HTMLInputElement;
    setThemeModeIndex(parseInt(value));
  }, []);

  const handleDensityChange = useCallback((evt) => {
    const { value } = evt.target as HTMLInputElement;
    setDensityIndex(parseInt(value));
  }, []);

  return (
    <ThemeProvider
      applyThemeClasses
      density="high"
      theme="vuu"
      themeMode="light"
    >
      <Flexbox
        style={{ flexDirection: "column", width: "100vw", height: "100vh" }}
      >
        <div className="vuuToolbarProxy ShowcaseToolbar" style={{ height: 30 }}>
          <Text styleAs="h3">Vuu Showcase</Text>
        </div>
        <Flexbox style={{ flexDirection: "row", flex: 1 }}>
          <Tree
            className="ShowcaseNav"
            style={{ flex: "0 0 200px" }}
            data-resizeable
            selected={[pathname.slice(1)]}
            onSelectionChange={handleChange}
            revealSelected
            source={source}
          />
          <ThemeProvider
            density={density.id}
            theme={theme.id}
            themeMode={themeMode.id}
          >
            <Flexbox
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
                  onChange={handleThemeChange}
                  value={themeIndex}
                >
                  <ToggleButton value={0}>No Theme</ToggleButton>
                  <ToggleButton value={1}>SALT</ToggleButton>
                  <ToggleButton value={2}>VUU</ToggleButton>
                </ToggleButtonGroup>

                <ToggleButtonGroup
                  className="vuuToggleButtonGroup"
                  onChange={handleThemeModeChange}
                  value={themeModeIndex}
                >
                  <ToggleButton value={0}>Light</ToggleButton>
                  <ToggleButton value={1}>Dark</ToggleButton>
                </ToggleButtonGroup>

                <ToggleButtonGroup
                  className="vuuToggleButtonGroup"
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
                <IFrame theme={theme.id} themeMode={themeMode.id} density={density.id} />
              </div>
            </Flexbox>
          </ThemeProvider>
        </Flexbox>
      </Flexbox>
    </ThemeProvider>
  );
};
