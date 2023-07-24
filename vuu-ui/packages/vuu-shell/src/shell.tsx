import { connectToServer } from "@finos/vuu-data";
import cx from "classnames";
import {
  HTMLAttributes,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useLayoutConfig } from "./layout-config";
import { DraggableLayout, LayoutProvider } from "@finos/vuu-layout";
import { LayoutJSON } from "@finos/vuu-layout/src/layout-reducer";
import { AppHeader } from "./app-header";
import { ThemeMode, ThemeProvider, useThemeAttributes } from "./theme-provider";
import { logger } from "@finos/vuu-utils";
import { useShellLayout } from "./shell-layouts";
import { SaveLocation } from "./shellTypes";

import "./shell.css";

export type VuuUser = {
  username: string;
  token: string;
};

const { error } = logger("Shell");

const warningLayout = {
  type: "View",
  props: {
    style: { height: "calc(100% - 6px)" },
  },
  children: [
    {
      props: {
        className: "vuuShell-warningPlaceholder",
      },
      type: "Placeholder",
    },
  ],
};

export interface ShellProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  defaultLayout?: LayoutJSON;
  leftSidePanel?: ReactElement;
  leftSidePanelLayout?: "full-height" | "inlay";
  loginUrl?: string;
  // paletteConfig: any;
  saveLocation?: SaveLocation;
  saveUrl?: string;
  serverUrl?: string;
  user: VuuUser;
}

export const Shell = ({
  children,
  className: classNameProp,
  defaultLayout = warningLayout,
  leftSidePanel,
  leftSidePanelLayout,
  loginUrl,
  saveLocation = "remote",
  saveUrl,
  serverUrl,
  user,
  ...htmlAttributes
}: ShellProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const layoutId = useRef("latest");
  const [layout, saveLayoutConfig, loadLayoutById] = useLayoutConfig({
    defaultLayout,
    saveLocation,
    user,
  });

  const handleLayoutChange = useCallback(
    (layout) => {
      try {
        saveLayoutConfig(layout);
      } catch {
        error?.("Failed to save layout");
      }
    },
    [saveLayoutConfig]
  );

  const handleSwitchTheme = useCallback((mode: ThemeMode) => {
    if (rootRef.current) {
      rootRef.current.dataset.mode = mode;
    }
  }, []);

  const handleNavigate = useCallback(
    (id) => {
      layoutId.current = id;
      loadLayoutById(id);
    },
    [loadLayoutById]
  );

  useEffect(() => {
    if (serverUrl && user.token) {
      connectToServer({
        authToken: user.token,
        url: serverUrl,
        username: user.username,
      });
    }
  }, [serverUrl, user.token, user.username]);

  const [themeClass, densityClass, dataMode] = useThemeAttributes();
  const className = cx("vuuShell", classNameProp, themeClass, densityClass);

  const shellLayout = useShellLayout({
    leftSidePanelLayout,
    appHeader: (
      <AppHeader
        layoutId={layoutId.current}
        loginUrl={loginUrl}
        user={user}
        onNavigate={handleNavigate}
        onSwitchTheme={handleSwitchTheme}
      />
    ),
    leftSidePanel,
  });

  return (
    // ShellContext TBD
    <ThemeProvider>
      <LayoutProvider layout={layout} onLayoutChange={handleLayoutChange}>
        <DraggableLayout
          className={className}
          data-mode={dataMode}
          ref={rootRef}
          {...htmlAttributes}
        >
          {shellLayout}
        </DraggableLayout>
      </LayoutProvider>
      {children}
    </ThemeProvider>
  );
};
