import { Button } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { useLogout } from "@vuu-ui/core";
import { NotificationType, useNotifications } from "@vuu-ui/vuu-notifications";
import {
  Toolbar,
  useContextPanel,
  useHideContextPanel,
} from "@vuu-ui/vuu-ui-controls";
import type { ThemeMode } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import { type HTMLAttributes, useCallback } from "react";
import { useWorkspace } from "../workspace-management";

import appHeaderCss from "./AppHeader.css";

const classBase = "vuuAppHeader";
export interface AppHeaderProps extends HTMLAttributes<HTMLDivElement> {
  themeMode?: ThemeMode;
}

export const AppHeader = ({
  className: classNameProp,
  themeMode: _,
  ...htmlAttributes
}: AppHeaderProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-app-header",
    css: appHeaderCss,
    window: targetWindow,
  });

  const className = cx(classBase, classNameProp);
  const logout = useLogout();

  const { resetApplication, setApplicationSetting } = useWorkspace();
  const { showNotification } = useNotifications();
  const showContextPanel = useContextPanel();
  const hideContextPanel = useHideContextPanel();

  const handleReset = useCallback(async () => {
    try {
      await resetApplication();
      hideContextPanel?.();
      showNotification({
        animationType: "slide-out",
        renderPostRefresh: true,
        type: NotificationType.Toast,
        header: "Success",
        content: "Settings and workspaces cleared",
        status: "success",
      });
    } catch (cause: unknown) {
      showNotification({
        type: NotificationType.Toast,
        header: "Reset failed",
        content: cause instanceof Error ? cause.message : "Unable to reset",
        status: "error",
      });
    }
  }, [hideContextPanel, resetApplication, showNotification]);

  const handleShowSettings = useCallback(() => {
    void setApplicationSetting("applicationSettings.panelOpen", true).catch(
      () => undefined,
    );
    showContextPanel(<div>Application settings</div>, "Settings");
  }, [setApplicationSetting, showContextPanel]);

  return (
    <Toolbar
      alignItems="end"
      className={className}
      role="banner"
      showSeparators
      {...htmlAttributes}
    >
      <Button
        className={`${classBase}-menuItem`}
        appearance="transparent"
        sentiment="neutral"
      >
        Help
      </Button>
      <Button
        appearance="transparent"
        className={`${classBase}-menuItem`}
        onClick={handleReset}
        sentiment="neutral"
      >
        Reset <span data-icon="history" />
      </Button>
      <Button
        appearance="transparent"
        className={`${classBase}-menuItem`}
        onClick={handleShowSettings}
        sentiment="neutral"
      >
        Settings <span data-icon="settings" />
      </Button>
      <Button
        appearance="transparent"
        className={`${classBase}-menuItem`}
        onClick={logout}
        sentiment="neutral"
      >
        Log out
      </Button>
    </Toolbar>
  );
};
