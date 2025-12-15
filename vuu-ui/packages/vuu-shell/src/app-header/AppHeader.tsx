import { Button } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { useLayoutOperation } from "@vuu-ui/vuu-layout";
import { Toolbar } from "@vuu-ui/vuu-ui-controls";
import type { ThemeMode } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import { HTMLAttributes, useCallback, useRef } from "react";
import { useLoginUrl } from "../application-provider";
import { logout } from "../login";

import appHeaderCss from "./AppHeader.css";
import { usePersistenceManager } from "../persistence-manager";
import { NotificationType, useNotifications } from "@vuu-ui/vuu-notifications";

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
  const loginUrl = useLoginUrl();

  const { showComponentInContextPanel } = useLayoutOperation();
  const { showNotification } = useNotifications();

  const handleLogout = useCallback(() => {
    logout(loginUrl);
  }, [loginUrl]);

  const handleReset = useCallback(() => {
    persistenceManager?.clearUserSettings();
    location.reload();
    showNotification({
      renderPostRefresh: true,
      type: NotificationType.Toast,
      header: "Success",
      content: "Settings cleared",
      status: "success",
    });
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
        appearance="bordered"
        sentiment="neutral"
      >
        Help
      </Button>
      <Button
        appearance="bordered"
        className={`${classBase}-menuItem`}
        onClick={handleReset}
        sentiment="neutral"
      >
        Reset <span data-icon="history" />
      </Button>
      <Button
        appearance="bordered"
        className={`${classBase}-menuItem`}
        onClick={handleShowSettings}
        ref={settingsButtonRef}
        sentiment="neutral"
      >
        Settings <span data-icon="settings" />
      </Button>
      <Button
        appearance="bordered"
        className={`${classBase}-menuItem`}
        onClick={handleLogout}
        sentiment="neutral"
      >
        Log out
      </Button>
    </Toolbar>
  );
};
