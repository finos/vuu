import { Flexbox } from "@finos/vuu-layout";
import { Tree, TreeSourceNode } from "@finos/vuu-ui-controls";
import { Density, ThemeMode, ThemeProvider } from "@finos/vuu-utils";
import { Button, Text } from "@salt-ds/core";
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
      console.log(`id=${id}`);
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

const availableThemes: ThemeDescriptor[] = [
  { id: "vuu", label: "Vuu Classic" },
  { id: "salt", label: "Salt Classic" },
];

export const App = ({ stories }: AppProps) => {
  console.log({ stories });
  const navigate = useNavigate();
  // // TODO cache source in localStorage
  const source = useMemo(() => sourceFromImports(stories), [stories]);
  const { pathname } = useLocation();
  const handleChange = ([selected]: TreeSourceNode[]) => navigate(selected.id);
  const [theme] = useState<ThemeDescriptor>(availableThemes[0]);
  const [themeMode] = useState<ThemeMode>("light");
  const [density] = useState<Density>("high");

  const launchStandaloneWindow = useCallback(() => {
    window.open(`${location.href}?standalone&theme=vuu`, "_blank");
  }, []);

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
                style={{
                  height: 30,
                  border: "solid 1px var(--salt-container-primary-borderColor)",
                }}
                data-mode="light"
              >
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
                <IFrame />
              </div>
            </Flexbox>
          </ThemeProvider>
        </Flexbox>
      </Flexbox>
    </ThemeProvider>
  );
};
