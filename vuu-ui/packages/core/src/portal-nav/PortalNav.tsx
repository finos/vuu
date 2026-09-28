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
import { ContextMenuProvider } from "@vuu-ui/vuu-context-menu";
import { useMemo } from "react";
import { useNavGroupExpansion } from "../portal-app-switcher/useNavGroupExpansion";
import {
  isNestedModule,
  type RemoteModuleDescriptor,
} from "../RemoteModuleDescriptor";
import { Link, useLocation } from "react-router-dom";
import { useNavContextMenu } from "../portal-app-switcher/useNavContextMenu";

import portalNavCss from "./PortalNav.css";

const classBase = "vuuPortalNav";

const toNavigationPath = (path: string) => path.replace(/\/\*$/, "");

type NavItem = {
  title: string;
  href: string;
  moduleId?: RemoteModuleDescriptor["id"];
  children?: NavItem[];
};

function NestedItem(props: { item: NavItem; icon?: boolean }) {
  const { item, icon } = props;
  const [expanded, setExpanded] = useNavGroupExpansion(item.href);
  const collapsed = !expanded;
  const location = useLocation();
  const targetWindow = useWindow();
  const { onContextMenu, onKeyDown } = useNavContextMenu({
    item,
    targetWindow,
  });

  if (Array.isArray(item.children) && item.children.length > 0) {
    return (
      <VerticalNavigationItem
        active={location.pathname.startsWith(item.href) && collapsed}
      >
        <Collapsible
          open={expanded}
          onOpenChange={(_, open) => setExpanded(open)}
        >
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
          onContextMenu={onContextMenu}
          onKeyDown={onKeyDown}
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
    if (isNestedModule(remoteModule)) {
      continue;
    }
    const pathSegments = remoteModule.navLocation.split("/").filter(Boolean);
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
