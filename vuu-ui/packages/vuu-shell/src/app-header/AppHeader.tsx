import { HTMLAttributes, useCallback } from "react";
import { VuuUser } from "../shell";
import { UserProfile } from "../user-profile";
import { ThemeMode, ThemeSwitch } from "../theme-switch";
import cx from "classnames";

import "./AppHeader.css";

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
  const className = cx(classBase, classNameProp, "salt-density-medium");
  const handleSwitchTheme = useCallback(
    (mode: ThemeMode) => onSwitchTheme?.(mode),
    [onSwitchTheme]
  );
  return (
    <header className={className} {...htmlAttributes}>
      <ThemeSwitch defaultMode={themeMode} onChange={handleSwitchTheme} />
      <UserProfile
        layoutId={layoutId}
        loginUrl={loginUrl}
        onNavigate={onNavigate}
        user={user}
      />
    </header>
  );
};
