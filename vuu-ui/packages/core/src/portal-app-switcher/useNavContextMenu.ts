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
  useMemo,
} from "react";
import { useHref } from "react-router-dom";
import { useOptionalSavedState } from "../saved-state/SavedStateContext";
import { getWindowHostPath } from "../window-host/window-host-routing";
import type { NavItem } from "./PortalAppSwitcher";

export const OPEN_MODULE_TAB = "open-module-tab";
export const OPEN_MODULE_WINDOW = "open-module-window";
export const OPEN_SAVED_STATE = "open-saved-state";

interface NavMenuOptions {
  savedState: boolean;
}

const moduleMenuBuilder: MenuBuilder = (location, options) => {
  if (location !== "portal-module") return [];
  const items: ContextMenuItemDescriptor[] = [
    { id: OPEN_MODULE_TAB, label: "Open in new Tab" },
    { id: OPEN_MODULE_WINDOW, label: "Open in new Window" },
  ];
  if ((options as NavMenuOptions | undefined)?.savedState) {
    items.push({
      dividerBefore: true,
      icon: "history",
      id: OPEN_SAVED_STATE,
      label: "Saved state…",
    });
  }
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
 * window, or open its Saved state (§9.2). Handles the mouse and the
 * ContextMenu / Shift+F10 keys.
 */
export const useNavContextMenu = ({
  item,
  targetWindow,
}: NavContextMenuHookProps): NavContextMenuHandlers => {
  const windowHref = useHref(
    item.moduleId === undefined ? "/" : getWindowHostPath(item.moduleId),
  );
  const savedState = useOptionalSavedState();
  const applicationKey =
    item.moduleId === undefined
      ? undefined
      : savedState?.applicationKeyForModule(item.moduleId);

  const showContextMenu = useContextMenu(moduleMenuBuilder, (action) => {
    if (action === OPEN_SAVED_STATE) {
      savedState?.open(applicationKey);
      return true;
    }
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

  const options = useMemo<NavMenuOptions>(
    () => ({ savedState: applicationKey !== undefined }),
    [applicationKey],
  );

  const onContextMenu = useCallback<MouseEventHandler<HTMLElement>>(
    (event) => {
      showContextMenu(event, "portal-module", options);
    },
    [options, showContextMenu],
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
          options,
        );
      }
    },
    [options, showContextMenu],
  );

  return item.moduleId === undefined ? {} : { onContextMenu, onKeyDown };
};
