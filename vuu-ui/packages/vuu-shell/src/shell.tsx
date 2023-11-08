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
import {
  DraggableLayout,
  LayoutProvider,
  LayoutProviderProps,
} from "@finos/vuu-layout";
import { LayoutChangeHandler } from "@finos/vuu-layout/src/layout-reducer";
import { AppHeader } from "./app-header";
import { ThemeMode, ThemeProvider, useThemeAttributes } from "./theme-provider";
import { logger } from "@finos/vuu-utils";
import { useShellLayout } from "./shell-layouts";
import { SaveLocation } from "./shellTypes";
import { useLayoutManager } from "./layout-management";

import "./shell.css";

export type VuuUser = {
  username: string;
  token: string;
};

const { error } = logger("Shell");

export interface ShellProps extends HTMLAttributes<HTMLDivElement> {
  LayoutProps?: Pick<
    LayoutProviderProps,
    "createNewChild" | "pathToDropTarget"
  >;
  children?: ReactNode;
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
  LayoutProps,
  children,
  className: classNameProp,
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
  const { applicationLayout, saveApplicationLayout, loadLayoutById } =
    useLayoutManager();

  const handleLayoutChange = useCallback<LayoutChangeHandler>(
    (layout, layoutChangeReason) => {
      try {
        console.log(`handle layout changed ${layoutChangeReason}`);
        saveApplicationLayout(layout);
        // saveLayoutConfig(layout);
      } catch {
        error?.("Failed to save layout");
      }
    },
    [saveApplicationLayout]
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
    <ThemeProvider>
      <LayoutProvider
        {...LayoutProps}
        layout={applicationLayout}
        onLayoutChange={handleLayoutChange}
      >
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
