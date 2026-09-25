import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
  VerticalNavigation,
  VerticalNavigationItem,
  VerticalNavigationItemContent,
  VerticalNavigationItemExpansionIcon,
  VerticalNavigationItemLabel,
  VerticalNavigationItemTrigger,
  VerticalNavigationSubMenu,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { Icon } from "@vuu-ui/vuu-ui-controls";
import {
  ContextMenuProvider,
  useContextMenu,
  type MenuBuilder,
} from "@vuu-ui/vuu-context-menu";
import { useMemo, useState } from "react";
import type { RemoteModuleDescriptor } from "../RemoteModuleDescriptor";
import { Link, useHref, useLocation } from "react-router-dom";
import { getWindowHostPath } from "../window-host/window-host-routing";

import portalNavCss from "./PortalNav.css";

const classBase = "vuuPortalNav";

const toNavigationPath = (path: string) => path.replace(/\/\*$/, "");

type NavItem = {
  title: string;
  href: string;
  moduleId?: RemoteModuleDescriptor["id"];
  children?: NavItem[];
};

const moduleMenuBuilder: MenuBuilder = (location) =>
  location === "portal-module"
    ? [
        { id: "open-module-tab", label: "Open in new Tab" },
        { id: "open-module-window", label: "Open in new Window" },
      ]
    : [];

function NestedItem(props: { item: NavItem; icon?: boolean }) {
  const { item, icon } = props;
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const targetWindow = useWindow();
  const windowHref = useHref(
    item.moduleId === undefined ? "/" : getWindowHostPath(item.moduleId),
  );
  const showContextMenu = useContextMenu(moduleMenuBuilder, (action) => {
    if (action !== "open-module-tab" && action !== "open-module-window") {
      return;
    }
    if (!targetWindow) {
      throw Error("Cannot open a module without a host window");
    }
    targetWindow.open(
      windowHref,
      "_blank",
      action === "open-module-window"
        ? "popup,width=1200,height=800,noopener,noreferrer"
        : "noopener,noreferrer",
    );
    return true;
  });

  if (Array.isArray(item.children) && item.children.length > 0) {
    return (
      <VerticalNavigationItem
        active={location.pathname.startsWith(item.href) && collapsed}
      >
        <Collapsible onOpenChange={(_, expanded) => setCollapsed(!expanded)}>
          <VerticalNavigationItemContent>
            <CollapsibleTrigger>
              <VerticalNavigationItemTrigger>
                {icon ? <Icon aria-hidden name="filter" /> : undefined}
                <VerticalNavigationItemLabel>
                  {item.title}
                </VerticalNavigationItemLabel>
                <VerticalNavigationItemExpansionIcon />
              </VerticalNavigationItemTrigger>
            </CollapsibleTrigger>
          </VerticalNavigationItemContent>
          <CollapsiblePanel>
            <VerticalNavigationSubMenu>
              {item.children.map((child) => (
                <NestedItem key={child.href} item={child} />
              ))}
            </VerticalNavigationSubMenu>
          </CollapsiblePanel>
        </Collapsible>
      </VerticalNavigationItem>
    );
  }

  return (
    <VerticalNavigationItem active={location.pathname === item.href}>
      <VerticalNavigationItemContent>
        <Link
          to={item.href}
          onContextMenu={
            item.moduleId === undefined
              ? undefined
              : (event) => showContextMenu(event, "portal-module", undefined)
          }
          onKeyDown={
            item.moduleId === undefined
              ? undefined
              : (event) => {
                  if (
                    event.key === "ContextMenu" ||
                    (event.shiftKey && event.key === "F10")
                  ) {
                    const { left, bottom } =
                      event.currentTarget.getBoundingClientRect();
                    event.preventDefault();
                    showContextMenu(
                      {
                        clientX: left,
                        clientY: bottom,
                      },
                      "portal-module",
                      undefined,
                    );
                  }
                }
          }
        >
          {icon ? (
            <Icon
              aria-hidden
              className={`${classBase}-item-icon`}
              name="filter"
            />
          ) : undefined}
          <VerticalNavigationItemLabel>
            {item.title}
          </VerticalNavigationItemLabel>
        </Link>
      </VerticalNavigationItemContent>
    </VerticalNavigationItem>
  );
}

export interface PortalNavProps {
  remoteModules: RemoteModuleDescriptor[];
}

const buildNavItems = (remoteModules: RemoteModuleDescriptor[]) => {
  const navItemsByPath = new Map<string, NavItem>();

  for (const remoteModule of remoteModules) {
    const pathSegments = remoteModule.location.split("/").filter(Boolean);
    const [parentTitle, childTitle] = pathSegments;

    if (parentTitle === undefined) {
      continue;
    }

    const parentPath = `/${parentTitle}`;
    let parent = navItemsByPath.get(parentPath);

    if (parent === undefined) {
      parent = {
        href:
          childTitle === undefined
            ? toNavigationPath(remoteModule.path)
            : parentPath,
        moduleId: childTitle === undefined ? remoteModule.id : undefined,
        title: parentTitle,
      };
      navItemsByPath.set(parentPath, parent);
    }

    if (
      childTitle !== undefined &&
      !parent.children?.some(
        ({ href }) => href === toNavigationPath(remoteModule.path),
      )
    ) {
      parent.children = [
        ...(parent.children ?? []),
        {
          href: toNavigationPath(remoteModule.path),
          moduleId: remoteModule.id,
          title: childTitle,
        },
      ];
    }
  }

  return [...navItemsByPath.values()];
};

export const PortalNav = ({ remoteModules }: PortalNavProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-portal-nav",
    css: portalNavCss,
    window: targetWindow,
  });

  const navItems = useMemo(() => buildNavItems(remoteModules), [remoteModules]);

  return (
    <ContextMenuProvider>
      <VerticalNavigation className={classBase}>
        {navItems.map((navItem) => (
          <NestedItem icon item={navItem} key={navItem.href} />
        ))}
      </VerticalNavigation>
    </ContextMenuProvider>
  );
};
