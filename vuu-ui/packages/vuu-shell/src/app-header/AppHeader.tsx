import { useLayoutProviderDispatch } from "@finos/vuu-layout";
import { Toolbar } from "@finos/vuu-ui-controls";
import { ThemeMode } from "@finos/vuu-utils";
import { Button } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes, useCallback } from "react";
import { logout } from "../login";

import appHeaderCss from "./AppHeader.css";

const classBase = "vuuAppHeader";
export interface AppHeaderProps extends HTMLAttributes<HTMLDivElement> {
  loginUrl?: string;
  themeMode?: ThemeMode;
}

export const AppHeader = ({
  className: classNameProp,
  loginUrl,
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

  const dispatchLayoutAction = useLayoutProviderDispatch();

  const handleLogout = useCallback(() => {
    logout(loginUrl);
  }, [loginUrl]);

  const handleShowSettings = useCallback(() => {
    dispatchLayoutAction({
      type: "set-props",
      path: "#context-panel",
      props: {
        expanded: true,
        content: {
          type: "ApplicationSettings",
        },
        title: "Settings",
      },
    });
  }, [dispatchLayoutAction]);

  return (
    <Toolbar
      alignItems="end"
      className={className}
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
