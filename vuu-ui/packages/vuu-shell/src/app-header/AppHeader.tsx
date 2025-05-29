import { useLayoutOperation } from "@vuu-ui/vuu-layout";
import { Toolbar } from "@vuu-ui/vuu-ui-controls";
import { ThemeMode } from "@vuu-ui/vuu-utils";
import { Button } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes, useCallback, useRef } from "react";
import { logout } from "../login";
import { useLoginUrl } from "../application-provider";

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

  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  const className = cx(classBase, classNameProp);
  const loginUrl = useLoginUrl();

  const { showComponentInContextPanel } = useLayoutOperation();

  const handleLogout = useCallback(() => {
    logout(loginUrl);
  }, [loginUrl]);

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
      <Button className={`${classBase}-menuItem`} variant="secondary">
        Help
      </Button>
      <Button className={`${classBase}-menuItem`} variant="secondary">
        History <span data-icon="history" />
      </Button>
      <Button
        className={`${classBase}-menuItem`}
        onClick={handleShowSettings}
        ref={settingsButtonRef}
        variant="secondary"
      >
        Settings <span data-icon="settings" />
      </Button>
      <Button
        className={`${classBase}-menuItem`}
        onClick={handleLogout}
        variant="secondary"
      >
        Log out
      </Button>
    </Toolbar>
  );
};
