import { Flexbox } from "@finos/vuu-layout";
import {
  Density,
  DensitySwitch,
  ThemeMode,
  ThemeProvider,
  ThemeSwitch,
} from "@finos/vuu-shell";
import { Dropdown } from "@salt-ds/lab";
import { Button, Text } from "@salt-ds/core";
import { IFrame, TreeSourceNode } from "./components";
import { ReactElement, useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Tree } from "./components";

import "./App.css";

type VuuExample = (() => ReactElement) & {
  displaySequence?: number;
};

type VuuTuple = [string, VuuExample | Examples];

const isVuuExample = (item: VuuExample | Examples): item is VuuExample =>
  typeof item === "function";

const byDisplaySequence = ([, f1]: VuuTuple, [, f2]: VuuTuple) => {
  if (isVuuExample(f1) && isVuuExample(f2)) {
    const { displaySequence: ds1 } = f1;
    const { displaySequence: ds2 } = f2;

    if (ds1 === undefined && ds2 === undefined) {
      return 0;
    }
    if (ds2 === undefined) {
      return -1;
    }
    if (ds1 === undefined) {
      return 1;
    }
    return ds1 - ds2;
  } else {
    return 0;
  }
};

const sourceFromImports = (
  stories: Examples,
  prefix = "",
  icon = "folder"
): TreeSourceNode[] =>
  Object.entries(stories)
    .filter(([path]) => path !== "default")
    .sort(byDisplaySequence)
    .map<TreeSourceNode>(([label, stories]) => {
      const id = `${prefix}${label}`;
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

interface Examples {
  [key: string]: Examples | VuuExample;
}
export interface AppProps {
  stories: Examples;
}

type ThemeDescriptor = { label?: string; id: string };

const availableThemes: ThemeDescriptor[] = [
  { id: "vuu-purple", label: "Purple Vuu" },
  { id: "salt", label: "Salt Classic" },
];

export const App = ({ stories }: AppProps) => {
  const navigate = useNavigate();
  const source = useMemo(() => sourceFromImports(stories), [stories]);
  const { pathname } = useLocation();
  const handleChange = ([selected]: TreeSourceNode[]) => navigate(selected.id);
  const [theme, setTheme] = useState<ThemeDescriptor>(availableThemes[0]);
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [density, setDensity] = useState<Density>("high");

  const launchStandaloneWindow = useCallback(() => {
    window.open(`${location.href}?standalone&theme=vuu-purple`, "_blank");
  }, []);

  const handleThemeChange = useCallback(
    (_evt, theme: ThemeDescriptor | null) => {
      console.log(`theme change ${theme}`);
      if (theme) {
        setTheme(theme);
      }
    },
    []
  );

  return (
    <ThemeProvider
      applyThemeClasses
      density="high"
      theme="salt"
      themeMode="light"
    >
      <Flexbox
        style={{ flexDirection: "column", width: "100vw", height: "100vh" }}
      >
        <div className="vuuToolbarProxy ShowcaseToolbar">
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
            density={density}
            theme={theme.id}
            themeMode={themeMode}
          >
            <Flexbox
              className="ShowcaseContentContainer"
              resizeable
              style={{ flexDirection: "column", flex: "1 1 auto" }}
            >
              <div
                className="vuuToolbarProxy ShowcaseContentToolbar salt-theme salt-density-high"
                data-mode="light"
              >
                <Dropdown
                  className="vuu-ThemePicker"
                  source={availableThemes}
                  selected={theme}
                  onSelectionChange={handleThemeChange}
                />

                <DensitySwitch onChange={setDensity} />
                <ThemeSwitch onChange={setThemeMode} />
                <Button
                  data-align-end
                  data-icon="open-in"
                  onClick={launchStandaloneWindow}
                />
              </div>
              <div
                className={`ShowcaseContent`}
                style={{
                  flex: "1 1 auto",
                  position: "relative",
                }}
              >
                <IFrame />
              </div>
            </Flexbox>
          </ThemeProvider>
        </Flexbox>
      </Flexbox>
    </ThemeProvider>
  );
};
