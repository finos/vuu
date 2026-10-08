import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
  VerticalNavigationItem,
  VerticalNavigationItemContent,
  VerticalNavigationItemExpansionIcon,
  VerticalNavigationItemLabel,
  VerticalNavigationItemTrigger,
  VerticalNavigationSubMenu,
} from "@salt-ds/core";
import { Icon } from "@vuu-ui/vuu-ui-controls";
import { useNavGroupExpansion } from "./useNavGroupExpansion";
import { Link, useLocation } from "react-router-dom";
import { useWindow } from "@salt-ds/window";
import type { NavItem } from "./PortalAppSwitcher";
import { useNavContextMenu } from "./useNavContextMenu";
import { useNavItemPresence } from "./useNavItemPresence";
import type { KeyboardEvent } from "react";

const classBase = "vuuPortalAppSwitcher";

export function NestedNavItem(props: {
  item: NavItem;
  icon?: boolean;
  showPresence?: boolean;
}) {
  const { item, icon, showPresence = true } = props;
  const [expanded, setExpanded] = useNavGroupExpansion(item.href);
  const collapsed = !expanded;
  const location = useLocation();
  const targetWindow = useWindow();
  const { anchorProps, className, elements, statusBadge, unavailable } =
    useNavItemPresence({ enabled: showPresence, item });
  const { onContextMenu, onKeyDown } = useNavContextMenu({
    item,
    targetWindow,
    unavailable,
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
          <VerticalNavigationItemContent className={className}>
            <CollapsibleTrigger {...anchorProps}>
              <VerticalNavigationItemTrigger>
                {icon ? <Icon aria-hidden name="filter" /> : undefined}
                <VerticalNavigationItemLabel>
                  {item.title}
                </VerticalNavigationItemLabel>
                {statusBadge}
                <VerticalNavigationItemExpansionIcon />
              </VerticalNavigationItemTrigger>
            </CollapsibleTrigger>
            {elements}
          </VerticalNavigationItemContent>
          <CollapsiblePanel>
            <VerticalNavigationSubMenu>
              {item.children.map((child) => (
                <NestedNavItem
                  key={child.href}
                  item={child}
                  showPresence={showPresence}
                />
              ))}
            </VerticalNavigationSubMenu>
          </CollapsiblePanel>
        </Collapsible>
      </VerticalNavigationItem>
    );
  }

  return (
    <VerticalNavigationItem active={location.pathname === item.href}>
      <VerticalNavigationItemContent className={className}>
        <Link
          {...anchorProps}
          to={item.href}
          onContextMenu={onContextMenu}
          onKeyDown={(event: KeyboardEvent<HTMLAnchorElement>) => {
            anchorProps.onKeyDown(event);
            onKeyDown?.(event);
          }}
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
          {statusBadge}
        </Link>
        {elements}
      </VerticalNavigationItemContent>
    </VerticalNavigationItem>
  );
}
