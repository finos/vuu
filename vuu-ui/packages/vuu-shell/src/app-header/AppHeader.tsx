import { HTMLAttributes, useCallback } from "react";
import { VuuUser } from "../shell";
// import { UserProfile } from "../user-profile";
// import { ThemeSwitch } from "../theme-switch";
import { ThemeMode } from "../theme-provider";
import cx from "classnames";
import { Toolbar } from "@finos/vuu-layout";
import { logout } from "../login";

import "./AppHeader.css";
import { Button } from "@salt-ds/core";

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
  themeMode = "light",
  user,
  ...htmlAttributes
}: AppHeaderProps) => {
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
      height={36}
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
