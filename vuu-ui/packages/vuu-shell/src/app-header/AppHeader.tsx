import { Button } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { useLayoutOperation } from "@vuu-ui/vuu-layout";
import { Toolbar } from "@vuu-ui/vuu-ui-controls";
import type { ThemeMode } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import { HTMLAttributes, useCallback, useRef } from "react";
import { usePersistenceManager } from "../persistence-manager";
import { NotificationType, useNotifications } from "@vuu-ui/vuu-notifications";
import { useLogout } from "../application-provider";

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

  const persistenceManager = usePersistenceManager();
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  const className = cx(classBase, classNameProp);
  const logout = useLogout();

  const { showComponentInContextPanel } = useLayoutOperation();
  const { showNotification } = useNotifications();

  const handleReset = useCallback(() => {
    persistenceManager?.clearUserSettings();
    showNotification({
      animationType: "slide-out",
      renderPostRefresh: true,
      type: NotificationType.Toast,
      header: "Success",
      content: "Settings cleared",
      status: "success",
    });
    location.reload();
  }, [persistenceManager, showNotification]);

  const handleShowSettings = useCallback(() => {
    showComponentInContextPanel(
      {
        type: "ApplicationSettings",
      },
      "Settings",
      () => settingsButtonRef.current?.focus(),
    );
  }, [showComponentInContextPanel]);

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
        ref={settingsButtonRef}
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
