import type { WindowContextType } from "@salt-ds/window";
import {
  type ContextMenuItemDescriptor,
  type MenuBuilder,
  useContextMenu,
} from "@vuu-ui/vuu-context-menu";
import {
  type KeyboardEventHandler,
  type MouseEventHandler,
  useCallback,
} from "react";
import { useHref } from "react-router-dom";
import { getWindowHostPath } from "../window-host/window-host-routing";
import type { NavItem } from "./PortalAppSwitcher";

export const OPEN_MODULE_TAB = "open-module-tab";
export const OPEN_MODULE_WINDOW = "open-module-window";

const moduleMenuBuilder: MenuBuilder = (location) => {
  if (location !== "portal-module") return [];
  const items: ContextMenuItemDescriptor[] = [
    { id: OPEN_MODULE_TAB, label: "Open in new Tab" },
    { id: OPEN_MODULE_WINDOW, label: "Open in new Window" },
  ];
  return items;
};

export interface NavContextMenuHookProps {
  item: NavItem;
  targetWindow: WindowContextType;
}

export interface NavContextMenuHandlers {
  onContextMenu?: MouseEventHandler<HTMLElement>;
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
}

/**
 * The context menu of a module in the navigation: open it in a new tab or
 * window. Handles the mouse and the ContextMenu / Shift+F10 keys.
 */
export const useNavContextMenu = ({
  item,
  targetWindow,
}: NavContextMenuHookProps): NavContextMenuHandlers => {
  const windowHref = useHref(
    item.moduleId === undefined ? "/" : getWindowHostPath(item.moduleId),
  );

  const showContextMenu = useContextMenu(moduleMenuBuilder, (action) => {
    if (action !== OPEN_MODULE_TAB && action !== OPEN_MODULE_WINDOW) {
      return;
    }
    if (!targetWindow) {
      throw Error("Cannot open a module without a host window");
    }
    targetWindow.open(
      windowHref,
      "_blank",
      action === OPEN_MODULE_WINDOW
        ? "popup,width=1200,height=800,noopener,noreferrer"
        : "noopener,noreferrer",
    );
    return true;
  });

  const onContextMenu = useCallback<MouseEventHandler<HTMLElement>>(
    (event) => {
      showContextMenu(event, "portal-module", undefined);
    },
    [showContextMenu],
  );

  const onKeyDown = useCallback<KeyboardEventHandler<HTMLElement>>(
    (event) => {
      if (
        event.key === "ContextMenu" ||
        (event.shiftKey && event.key === "F10")
      ) {
        const { left, bottom } = event.currentTarget.getBoundingClientRect();
        event.preventDefault();
        showContextMenu(
          { clientX: left, clientY: bottom },
          "portal-module",
          undefined,
        );
      }
    },
    [showContextMenu],
  );

  return item.moduleId === undefined ? {} : { onContextMenu, onKeyDown };
};
