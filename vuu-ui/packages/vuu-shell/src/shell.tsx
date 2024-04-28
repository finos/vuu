import { connectToServer } from "@finos/vuu-data-remote";
import {
  DraggableLayout,
  LayoutProvider,
  LayoutProviderProps,
  StackLayout,
} from "@finos/vuu-layout";
import { LayoutChangeHandler } from "@finos/vuu-layout/src/layout-reducer";
import { ContextMenuProvider, useDialog } from "@finos/vuu-popups";
import {
  logger,
  ThemeMode,
  ThemeProvider,
  useThemeAttributes,
} from "@finos/vuu-utils";
import cx from "clsx";
import {
  HTMLAttributes,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppHeader } from "./app-header";
import { useLayoutManager } from "./layout-management";
import {
  loadingApplicationJson,
  useLayoutContextMenuItems,
} from "./persistence-management";
import { SidePanelProps, useShellLayout } from "./shell-layouts";
import { SaveLocation } from "./shellTypes";

import "./shell.css";

if (typeof StackLayout !== "function") {
  console.warn(
    "StackLayout module not loaded, will be unsbale to deserialize from layout JSON"
  );
}

export type VuuUser = {
  username: string;
  token: string;
};

const { error } = logger("Shell");

const defaultLeftSidePanel: ShellProps["LeftSidePanelProps"] = {};

export type LayoutTemplateName = "full-height" | "inlay";

export interface ShellProps extends HTMLAttributes<HTMLDivElement> {
  LayoutProps?: Pick<
    LayoutProviderProps,
    "createNewChild" | "pathToDropTarget"
  >;
  LeftSidePanelProps?: SidePanelProps;
  children?: ReactNode;
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
  LeftSidePanelProps = defaultLeftSidePanel,
  children,
  className: classNameProp,
  leftSidePanelLayout,
  loginUrl,
  saveLocation: _,
  saveUrl,
  serverUrl,
  user,
  ...htmlAttributes
}: ShellProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const { dialog, setDialogState } = useDialog();
  const layoutId = useRef("latest");
  const { applicationJson, saveApplicationLayout, loadLayoutById } =
    useLayoutManager();
  const { buildMenuOptions, handleMenuAction } =
    useLayoutContextMenuItems(setDialogState);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "rejected"
  >("connected");

  const handleLayoutChange = useCallback<LayoutChangeHandler>(
    (layout) => {
      try {
        saveApplicationLayout(layout);
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

  // TODO this is out of date
  const handleNavigate = useCallback(
    (id) => {
      layoutId.current = id;
      loadLayoutById(id);
    },
    [loadLayoutById]
  );

  useMemo(async () => {
    if (serverUrl && user.token) {
      const connectionStatus = await connectToServer({
        authToken: user.token,
        url: serverUrl,
        username: user.username,
      });
      setConnectionStatus(connectionStatus);
    }
  }, [serverUrl, user.token, user.username]);

  const [themeClass, densityClass, dataMode] = useThemeAttributes();
  const className = cx("vuuShell", classNameProp, themeClass, densityClass);

  const isLoading = applicationJson === loadingApplicationJson;

  const shellLayout = useShellLayout({
    LeftSidePanelProps,
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
  });

  if (connectionStatus === "rejected") {
    console.log("game over, no connection to server");
  }

  return isLoading ? null : (
    <ThemeProvider>
      <ContextMenuProvider
        menuActionHandler={handleMenuAction}
        menuBuilder={buildMenuOptions}
      >
        <LayoutProvider
          {...LayoutProps}
          layout={applicationJson.layout}
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
        {children || dialog}
      </ContextMenuProvider>
    </ThemeProvider>
  );
};
