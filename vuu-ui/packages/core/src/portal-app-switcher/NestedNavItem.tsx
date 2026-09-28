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

const classBase = "vuuPortalAppSwitcher";

export function NestedNavItem(props: { item: NavItem; icon?: boolean }) {
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
                <NestedNavItem key={child.href} item={child} />
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
