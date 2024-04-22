import { Toolbar } from "@finos/vuu-ui-controls";
import { ThemeMode } from "@finos/vuu-utils";
import { Button } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes, useCallback } from "react";
import { logout } from "../login";
import { VuuUser } from "../shell";

import appHeaderCss from "./AppHeader.css";

const classBase = "vuuAppHeader";
export interface AppHeaderProps extends HTMLAttributes<HTMLDivElement> {
  layoutId: string;
  loginUrl?: string;
  onNavigate: (id: string) => void;
  onSwitchTheme?: (mode: ThemeMode) => void;
  themeMode?: ThemeMode;
  user: VuuUser;
}

export const AppHeader = ({
  className: classNameProp,
  layoutId,
  loginUrl,
  onNavigate,
  onSwitchTheme,
  themeMode: _,
  user,
  ...htmlAttributes
}: AppHeaderProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-app-header",
    css: appHeaderCss,
    window: targetWindow,
  });

  const className = cx(classBase, classNameProp);
  // const handleSwitchTheme = useCallback(
  //   (mode: ThemeMode) => onSwitchTheme?.(mode),
  //   [onSwitchTheme]
  // );

  const handleLogout = useCallback(() => {
    logout(loginUrl);
  }, [loginUrl]);

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
      <Button className={`${classBase}-menuItem`} variant="secondary">
        View <span data-icon="settings" />
      </Button>
      <Button
        className={`${classBase}-menuItem`}
        onClick={handleLogout}
        variant="secondary"
      >
        Log out
      </Button>
      {/* <ThemeSwitch
        data-align="right"
        defaultMode={themeMode}
        onChange={handleSwitchTheme}
      /> */}
      {/* <UserProfile
        layoutId={layoutId}
        loginUrl={loginUrl}
        onNavigate={onNavigate}
        user={user}
      /> */}
    </Toolbar>
  );
};
