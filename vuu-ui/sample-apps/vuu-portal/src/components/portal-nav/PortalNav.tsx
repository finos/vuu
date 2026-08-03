import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
  FlexItem,
  FlexLayout,
  Link,
  VerticalNavigation,
  VerticalNavigationItem,
  VerticalNavigationItemContent,
  VerticalNavigationItemExpansionIcon,
  VerticalNavigationItemLabel,
  VerticalNavigationItemTrigger,
  VerticalNavigationSubMenu,
} from "@salt-ds/core";
import { Icon } from "@vuu-ui/vuu-ui-controls";
import {
  forwardRef,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import type { RemoteModuleDescriptor } from "../../module-federation/mf-utils";

import "./PortalNav.css";

const classBase = "vuuPortalNav";

type NavItem = {
  title: string;
  href: string;
  children?: NavItem[];
};

const MockedTrigger = forwardRef<
  HTMLAnchorElement,
  ComponentPropsWithoutRef<typeof Link>
>(function MockedTrigger(props, ref) {
  const { href, ...rest } = props;

  return (
    <VerticalNavigationItemTrigger
      render={<Link href={href} ref={ref} />}
      {...rest}
    />
  );
});

function NestedItem(props: { item: NavItem; icon?: boolean }) {
  const { item, icon } = props;
  const [collapsed, setCollapsed] = useState(false);

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
        <MockedTrigger href={item.href}>
          {icon ? <Icon aria-hidden name="filter" /> : undefined}
          <VerticalNavigationItemLabel>
            {item.title}
          </VerticalNavigationItemLabel>
        </MockedTrigger>
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
    const pathSegments = remoteModule.path.split("/").filter(Boolean);
    const [parentTitle, childTitle] = pathSegments;

    if (parentTitle === undefined) {
      continue;
    }

    const parentPath = `/${parentTitle}`;
    let parent = navItemsByPath.get(parentPath);

    if (parent === undefined) {
      parent = {
        href: parentPath,
        title: parentTitle,
      };
      navItemsByPath.set(parentPath, parent);
    }

    if (
      childTitle !== undefined &&
      !parent.children?.some(({ href }) => href === remoteModule.path)
    ) {
      parent.children = [
        ...(parent.children ?? []),
        {
          href: remoteModule.path,
          title: childTitle,
        },
      ];
    }
  }

  return [...navItemsByPath.values()];
};

export const PortalNav = ({ remoteModules }: PortalNavProps) => {
  const navItems = useMemo(() => buildNavItems(remoteModules), [remoteModules]);

  return (
    <FlexLayout className={classBase}>
      <FlexItem className={`${classBase}-nav`}>
        <VerticalNavigation>
          {navItems.map((navItem) => (
            <NestedItem icon item={navItem} key={navItem.href} />
          ))}
        </VerticalNavigation>
      </FlexItem>
      <FlexItem className={`${classBase}-close`} />
    </FlexLayout>
  );
};
