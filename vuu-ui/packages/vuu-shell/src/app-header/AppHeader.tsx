import { HTMLAttributes, useCallback } from "react";
import { VuuUser } from "../shell";
import { UserProfile } from "../user-profile";
import { ThemeMode, ThemeSwitch } from "../theme-switch";
import cx from "classnames";

import "./AppHeader.css";
import { Density } from "@salt-ds/core";
import { DensitySwitch } from "../density-switch";

const classBase = "vuuAppHeader";
export interface AppHeaderProps extends HTMLAttributes<HTMLDivElement> {
  layoutId: string;
  loginUrl?: string;
  onNavigate: (id: string) => void;
  onSwitchTheme?: (mode: ThemeMode) => void;
  themeMode?: ThemeMode;
  onDensitySwitch?: (density: Density) => void;
  density?: Density
  user: VuuUser;
}

export const AppHeader = ({
  className: classNameProp,
  layoutId,
  loginUrl,
  onNavigate,
  onSwitchTheme,
  themeMode = "light",
  onDensitySwitch,
  density="medium",
  user,
  ...htmlAttributes
}: AppHeaderProps) => {
  const className = cx(classBase, classNameProp, `salt-density-${density}`);
  const handleSwitchTheme = useCallback(
    (mode: ThemeMode) => onSwitchTheme?.(mode),
    [onSwitchTheme]
  );
  const handleDensitySwitch = useCallback(
    (density: Density) => onDensitySwitch?.(density),
    [onDensitySwitch]
  );
  return (
    <header className={className} {...htmlAttributes}>
      <ThemeSwitch defaultMode={themeMode} onChange={handleSwitchTheme} />
      <DensitySwitch defaultDensity={density} onDensityChange={handleDensitySwitch} />
      <UserProfile
        layoutId={layoutId}
        loginUrl={loginUrl}
        onNavigate={onNavigate}
        user={user}
      />
    </header>
  );
};
