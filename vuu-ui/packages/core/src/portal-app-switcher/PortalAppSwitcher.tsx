import { VerticalNavigation } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { ContextMenuProvider } from "@vuu-ui/vuu-context-menu";
import cx from "clsx";
import { useEffect, useMemo } from "react";
import type { RemoteModuleDescriptor } from "../RemoteModuleDescriptor";
import { IconNavItem } from "./IconNavItem";
import { NestedNavItem } from "./NestedNavItem";
import { buildNavItems } from "./nav-item-utils";

import portalNavCss from "./PortalAppSwitcher.css";
import { useLocation } from "react-router-dom";

const classBase = "vuuPortalAppSwitcher";
const circleQuestionMarkIcon =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvcj0ic3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWNpcmNsZS1xdWVzdGlvbi1tYXJrIHByZXZpZXctaWNvbiI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiLz48cGF0aCBkPSJNOS4wOSA5YTMgMyAwIDAgMSA1LjgzIDFjMCAyLTMgMy0zIDMiLz48cGF0aCBkPSJNMTIgMTdoLjAxIi8+PC9zdmc+";

export type AppSwitcherDisplayStyle = "icon-only" | "icon text" | "text-only";
export type AppSwitcherMenuStyle = "single-level" | "two-level";

export interface NavItem {
  title: string;
  href: string;
  moduleId?: RemoteModuleDescriptor["id"];
  children?: NavItem[];
  navIconName?: string;
  navIconUrl?: string;
}

export interface PortalAppSwitcherProps {
  displayStyle?: AppSwitcherDisplayStyle;
  /** Single-level renders each module with a colon-separated navigation label. */
  menuStyle?: AppSwitcherMenuStyle;
  remoteModules: RemoteModuleDescriptor[];
}

export const PortalAppSwitcher = ({
  displayStyle = "text-only",
  menuStyle = "two-level",
  remoteModules,
}: PortalAppSwitcherProps) => {
  const iconOnly = displayStyle === "icon-only";
  const location = useLocation();

  const effectiveMenuStyle =
    iconOnly && menuStyle === "two-level" ? "single-level" : menuStyle;

  useEffect(() => {
    if (iconOnly && menuStyle === "two-level") {
      console.warn(
        'PortalAppSwitcher: menuStyle "two-level" is not supported with displayStyle "icon-only"; using "single-level".',
      );
    }
  }, [iconOnly, menuStyle]);

  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-portal-nav",
    css: portalNavCss,
    window: targetWindow,
  });

  const navItems = useMemo(() => {
    if (displayStyle !== "icon-only") {
      return buildNavItems(remoteModules, effectiveMenuStyle);
    }
    const resolvedRemoteModules = remoteModules.map((remoteModule) => {
      if (remoteModule.navIconUrl || remoteModule.navIconName) {
        return remoteModule;
      }
      console.log(
        `PortalAppSwitcher: module "${remoteModule.name}" has no navIconUrl or navIconName.`,
      );
      return {
        ...remoteModule,
        navIconUrl: circleQuestionMarkIcon,
      };
    });
    return buildNavItems(resolvedRemoteModules, effectiveMenuStyle);
  }, [displayStyle, effectiveMenuStyle, remoteModules]);

  const NavItem = iconOnly ? IconNavItem : NestedNavItem;

  return (
    <ContextMenuProvider>
      <VerticalNavigation
        className={cx(
          classBase,
          `${classBase}-${displayStyle}`,
          `${classBase}-${effectiveMenuStyle}`,
        )}
      >
        {navItems.map((navItem) => (
          <NavItem
            active={location.pathname.startsWith(navItem.href)}
            item={navItem}
            key={navItem.href}
          />
        ))}
      </VerticalNavigation>
    </ContextMenuProvider>
  );
};
