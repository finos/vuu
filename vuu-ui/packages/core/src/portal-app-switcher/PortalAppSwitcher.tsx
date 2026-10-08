import { VerticalNavigation } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { ContextMenuProvider } from "@vuu-ui/vuu-context-menu";
import cx from "clsx";
import { useEffect, useMemo } from "react";
import {
  isNestedModule,
  type RemoteModuleDescriptor,
} from "../RemoteModuleDescriptor";
import { IconNavItem } from "./IconNavItem";
import { NestedNavItem } from "./NestedNavItem";
import {
  buildNavItems,
  circleQuestionMarkIcon,
  navItemModuleIds,
} from "./nav-item-utils";
import { useServerMonitor } from "../server-monitor/VuuServerMonitorProvider";

import portalNavCss from "./PortalAppSwitcher.css";
import { useLocation } from "react-router-dom";
import { DashboardNavItem } from "./DashboardNavItem";

const classBase = "vuuPortalAppSwitcher";

export type AppSwitcherDisplayStyle =
  "icon-only" | "icon text" | "text-only" | "dashboard";
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
  /**
   * Greys applications whose server is unavailable, and explains why on
   * hover. Default true.
   */
  showPresence?: boolean;
}

export const PortalAppSwitcher = ({
  displayStyle = "text-only",
  menuStyle = "two-level",
  remoteModules,
  showPresence = true,
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
    if (displayStyle !== "icon-only" && displayStyle !== "dashboard") {
      return buildNavItems(remoteModules, effectiveMenuStyle);
    }
    const resolvedRemoteModules = remoteModules.map((remoteModule) => {
      if (
        remoteModule.navIconUrl ||
        remoteModule.navIconName ||
        isNestedModule(remoteModule)
      ) {
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

  // The monitor prioritises servers in the order the user sees them.
  const monitor = useServerMonitor();
  useEffect(() => {
    monitor?.setDisplayOrder(navItemModuleIds(navItems));
  }, [monitor, navItems]);

  const NavItem =
    displayStyle === "dashboard"
      ? DashboardNavItem
      : iconOnly
        ? IconNavItem
        : NestedNavItem;

  const Container = displayStyle === "dashboard" ? "nav" : VerticalNavigation;

  return (
    <ContextMenuProvider>
      <Container
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
            showPresence={showPresence}
          />
        ))}
      </Container>
    </ContextMenuProvider>
  );
};
