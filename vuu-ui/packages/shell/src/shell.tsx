import { connectToServer /*, useViewserver */ } from "@vuu-ui/data-remote";
// import { ThemeProvider } from "@vuu-ui/theme";
import React, {
  MouseEvent,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import useLayoutConfig from "./use-layout-config";

import {
  Chest,
  DraggableLayout,
  Drawer,
  FlexboxLayout as Flexbox,
  LayoutProvider,
  View,
} from "@vuu-ui/layout";

import { AppHeader } from "./app-header";
import { AppPalette } from "./app-palette";

import { LayoutJSON } from "@vuu-ui/layout/src/layout-reducer";
import "./shell.css";

export interface ShellProps {
  children?: ReactNode;
  defaultLayout?: LayoutJSON;
  paletteConfig: any;
  serverUrl: string;
  user: any;
}

export const Shell = ({
  children,
  defaultLayout,
  paletteConfig,
  serverUrl,
  user,
}: ShellProps) => {
  const paletteView = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const layoutId = useRef("latest");

  const [layout, setLayoutConfig, loadLayoutById] = useLayoutConfig(
    user,
    defaultLayout
  );

  const handleLayoutChange = useCallback(
    (layout) => {
      setLayoutConfig(layout);
    },
    [setLayoutConfig]
  );

  const handleDrawerClick = (e: MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (!paletteView.current?.contains(target)) {
      setOpen(!open);
    }
  };

  const handleNavigate = useCallback(
    (id) => {
      layoutId.current = id;
      loadLayoutById(id);
    },
    [loadLayoutById]
  );

  useEffect(() => {
    connectToServer(serverUrl, user.token);
  }, [serverUrl, user.token]);

  return (
    // <ThemeProvider>
    <>
      <LayoutProvider layout={layout} onLayoutChange={handleLayoutChange}>
        <DraggableLayout
          className="hw"
          style={{ width: "100vw", height: "100vh" }}

          // layout={layout}
        >
          <Flexbox
            className="App"
            style={{ flexDirection: "column", height: "100%" }}
          >
            <AppHeader
              layoutId={layoutId.current}
              user={user}
              onNavigate={handleNavigate}
            />
            <Chest style={{ flex: 1 }}>
              <Drawer
                onClick={handleDrawerClick}
                open={open}
                position="left"
                inline
                peekaboo
                sizeOpen={200}
                toggleButton="end"
              >
                <View
                  className="vuuShell-palette"
                  id="vw-app-palette"
                  key="app-palette"
                  ref={paletteView}
                  title="Views"
                  header
                  style={{ height: "100%" }}
                >
                  <AppPalette
                    config={paletteConfig}
                    style={{ flex: 1, width: 200 }}
                  />
                </View>
              </Drawer>
              <DraggableLayout
                dropTarget
                style={{ width: "100%", height: "100%" }}
              ></DraggableLayout>
            </Chest>
          </Flexbox>
        </DraggableLayout>
      </LayoutProvider>
      {children}
    </>
    // </ThemeProvider>
  );
};
