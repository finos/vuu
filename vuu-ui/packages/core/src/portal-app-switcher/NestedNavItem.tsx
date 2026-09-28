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
import { useContextMenu, type MenuBuilder } from "@vuu-ui/vuu-context-menu";
import { useNavGroupExpansion } from "./useNavGroupExpansion";
import { Link, useHref, useLocation } from "react-router-dom";
import { useWindow } from "@salt-ds/window";
import { getWindowHostPath } from "../window-host/window-host-routing";
import type { NavItem } from "./PortalAppSwitcher";

const classBase = "vuuPortalAppSwitcher";

const moduleMenuBuilder: MenuBuilder = (location) =>
  location === "portal-module"
    ? [
        { id: "open-module-tab", label: "Open in new Tab" },
        { id: "open-module-window", label: "Open in new Window" },
      ]
    : [];

export function NestedNavItem(props: { item: NavItem; icon?: boolean }) {
  const { item, icon } = props;
  const [expanded, setExpanded] = useNavGroupExpansion(item.href);
  const collapsed = !expanded;
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
