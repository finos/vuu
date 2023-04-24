import { Flexbox } from "@finos/vuu-layout";
import { DensitySwitch, ThemeProvider, ThemeSwitch } from "@finos/vuu-shell";
import { Toolbar, ToolbarButton } from "@heswell/salt-lab";
import { Text } from "@salt-ds/core";
import Module from "module";
import { ReactElement, useCallback, useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Tree } from "./components";

import "./App.css";

type VuuExample = (() => ReactElement) & {
  displaySequence?: number;
};

type VuuTuple = [string, VuuExample];

interface SourceNode {
  id: string;
  icon: string;
  label: string;
  childNodes?: SourceNode[];
}

const byDisplaySequence = ([, f1]: VuuTuple, [, f2]: VuuTuple) => {
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
};

const sourceFromImports = (
  stories: Module,
  prefix = "",
  icon = "folder"
): SourceNode[] =>
  Object.entries(stories)
    .filter(([path]) => path !== "default")
    .sort(byDisplaySequence)
    .map<SourceNode>(([label, stories]) => {
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

export interface AppProps {
  stories: Module;
}

export const App = ({ stories }: AppProps) => {
  console.log({ stories: Object.entries(stories) });
  const navigate = useNavigate();
  const source = useMemo(() => sourceFromImports(stories), [stories]);
  const { pathname } = useLocation();
  const handleChange = (evt, [selected]) => navigate(selected.id);

  const launchStandaloneWindow = useCallback(() => {
    window.open(`${location.href}?standalone`, "_blank");
  }, []);

  return (
    <ThemeProvider
      density="high"
      themeMode="light"
      applyClassesTo="child"
    >
      <Flexbox
        style={{ flexDirection: "column", width: "100vw", height: "100vh" }}
      >
        <Toolbar className="ShowcaseToolbar">
          <Text styleAs="h3">Vuu Showcase</Text>
        </Toolbar>
        <Flexbox style={{ flexDirection: "row", flex: 1 }}>
          <Tree
            className="ShowcaseNav"
            style={{ flex: "0 0 200px" }}
            data-resizeable
            defaultSelected={[pathname.slice(1)]}
            onSelectionChange={handleChange}
            revealSelected
            source={source}
          />
          <ThemeProvider
          applyClassesTo="child"
          >
            <Flexbox
              className="ShowcaseContentContainer"
              resizeable
              style={{ flexDirection: "column", flex: "1 1 auto" }}
            >
              <Toolbar
                className="ShowcaseContentToolbar salt-theme salt-density-high"
                data-mode="light"
              >
                <DensitySwitch />
                <ThemeSwitch />
                <ToolbarButton
                  data-align-end
                  data-icon="open-in"
                  onClick={launchStandaloneWindow}
                />
              </Toolbar>
              <div
                className={`ShowcaseContent`}
                style={{
                  flex: "1 1 auto",
                  position: "relative",
                }}
              >
                <Outlet />
              </div>
            </Flexbox>
          </ThemeProvider>
        </Flexbox>
      </Flexbox>
    </ThemeProvider>
  );
};
