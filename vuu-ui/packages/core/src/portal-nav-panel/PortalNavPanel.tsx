import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { ContextMenuProvider } from "@vuu-ui/vuu-context-menu";
import { Icon } from "@vuu-ui/vuu-ui-controls";
import cx from "clsx";
import { type CSSProperties, type HTMLAttributes, useMemo } from "react";
import { Link } from "react-router-dom";
import type { NavItem } from "../portal-app-switcher/PortalAppSwitcher";
import {
  buildNavItems,
  circleQuestionMarkIcon,
} from "../portal-app-switcher/nav-item-utils";
import { useNavContextMenu } from "../portal-app-switcher/useNavContextMenu";
import type { RemoteModuleDescriptor } from "../RemoteModuleDescriptor";

import portalNavPanelCss from "./PortalNavPanel.css";

const classBase = "vuuPortalNavPanel";

const PortalNavPanelItem = ({ item }: { item: NavItem }) => {
  const { href, navIconName, navIconUrl, title } = item;
  const targetWindow = useWindow();
  const { onContextMenu, onKeyDown } = useNavContextMenu({
    item,
    targetWindow,
  });
  const iconUrl =
    navIconUrl ?? (navIconName ? undefined : circleQuestionMarkIcon);
  const style = iconUrl
    ? ({ "--vuu-icon-svg": `url('${iconUrl}')` } as CSSProperties)
    : undefined;

  return (
    <li className={`${classBase}-item`}>
      <Link
        className={`${classBase}-link`}
        onContextMenu={onContextMenu}
        onKeyDown={onKeyDown}
        to={href}
      >
        <span className={`${classBase}-iconContainer`}>
          <Icon name={navIconName ?? "custom"} style={style} />
        </span>
        <span className={`${classBase}-label`}>{title}</span>
      </Link>
    </li>
  );
};

export interface PortalNavPanelProps extends HTMLAttributes<HTMLElement> {
  remoteModules: RemoteModuleDescriptor[];
}

/**
 * Landing view of the portal: a grid of large icon links, one per
 * available (non-nested) remote module.
 */
export const PortalNavPanel = ({
  className,
  remoteModules,
  ...htmlAttributes
}: PortalNavPanelProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-portal-nav-panel",
    css: portalNavPanelCss,
    window: targetWindow,
  });

  const navItems = useMemo(
    () => buildNavItems(remoteModules, "single-level"),
    [remoteModules],
  );

  return (
    <ContextMenuProvider>
      <nav
        aria-label="Applications"
        {...htmlAttributes}
        className={cx(classBase, className)}
      >
        <ul className={`${classBase}-grid`}>
          {navItems.map((item) => (
            <PortalNavPanelItem item={item} key={item.href} />
          ))}
        </ul>
      </nav>
    </ContextMenuProvider>
  );
};
