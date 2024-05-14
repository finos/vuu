import { connectToServer } from "@finos/vuu-data-remote";
import type { LayoutChangeHandler } from "@finos/vuu-layout";
import {
  DraggableLayout,
  LayoutProvider,
  LayoutProviderProps,
  StackLayout,
  registerComponent,
} from "@finos/vuu-layout";
import { ContextMenuProvider, useDialog } from "@finos/vuu-popups";
import { VuuUser, logger } from "@finos/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
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
import { ApplicationProvider } from "./application-provider";
import { ApplicationSettingsPanel } from "./application-settings";
import {
  useLayoutContextMenuItems,
  useLayoutManager,
} from "./layout-management";
import { loadingApplicationJson } from "./persistence-management";
import { SidePanelProps, useShellLayout } from "./shell-layouts";
import { SaveLocation } from "./shellTypes";

import shellCss from "./shell.css";

registerComponent("ApplicationSettings", ApplicationSettingsPanel, "view");

if (typeof StackLayout !== "function") {
  console.warn(
    "StackLayout module not loaded, will be unsbale to deserialize from layout JSON"
  );
}

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
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-shell",
    css: shellCss,
    window: targetWindow,
  });

  const rootRef = useRef<HTMLDivElement>(null);
  const { dialog, setDialogState } = useDialog();
  const { applicationJson, saveApplicationLayout } = useLayoutManager();
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

  const className = cx("vuuShell");

  const isLayoutLoading = applicationJson === loadingApplicationJson;

  const shellLayout = useShellLayout({
    LeftSidePanelProps,
    leftSidePanelLayout,
    appHeader: <AppHeader loginUrl={loginUrl} />,
  });

  if (connectionStatus === "rejected") {
    console.log("game over, no connection to server");
  }

  return isLayoutLoading ? null : (
    <ApplicationProvider user={user}>
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
            ref={rootRef}
            {...htmlAttributes}
          >
            {shellLayout}
          </DraggableLayout>
        </LayoutProvider>
        {children || dialog}
      </ContextMenuProvider>
    </ApplicationProvider>
  );
};
