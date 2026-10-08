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
import {
  useModuleUnreadCount,
  useNotificationPresentation,
  usePortalNotifications,
} from "../notifications/PortalNotificationsProvider";
import { getWindowHostPath } from "../window-host/window-host-routing";
import type { NavItem } from "./PortalAppSwitcher";

export const OPEN_MODULE_TAB = "open-module-tab";
export const OPEN_MODULE_WINDOW = "open-module-window";
export const SHOW_MODULE_NOTIFICATIONS = "show-module-notifications";
export const MARK_MODULE_NOTIFICATIONS_READ = "mark-module-notifications-read";

interface ModuleMenuOptions {
  unavailable?: boolean;
  /** Undefined when the portal has no notifications. */
  unreadCount?: number;
}

const moduleMenuBuilder: MenuBuilder<string, ModuleMenuOptions | undefined> = (
  location,
  options,
) => {
  if (location !== "portal-module") return [];
  const disabled = options?.unavailable === true;
  const items: ContextMenuItemDescriptor[] = [
    { disabled, id: OPEN_MODULE_TAB, label: "Open in new Tab" },
    { disabled, id: OPEN_MODULE_WINDOW, label: "Open in new Window" },
  ];
  if (options?.unreadCount !== undefined) {
    items.push(
      { id: SHOW_MODULE_NOTIFICATIONS, label: "Show notifications" },
      {
        disabled: options.unreadCount === 0,
        id: MARK_MODULE_NOTIFICATIONS_READ,
        label: "Mark notifications read",
      },
    );
  }
  return items;
};

export interface NavContextMenuHookProps {
  item: NavItem;
  /** Disables opening the module, while its server is unavailable. */
  unavailable?: boolean;
  targetWindow: WindowContextType;
}

export interface NavContextMenuHandlers {
  onContextMenu?: MouseEventHandler<HTMLElement>;
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
}

/**
 * The context menu of a module in the navigation: open it in a new tab or
 * window, and show or mark read its notifications. Handles the mouse and
 * the ContextMenu / Shift+F10 keys.
 */
export const useNavContextMenu = ({
  item,
  targetWindow,
  unavailable = false,
}: NavContextMenuHookProps): NavContextMenuHandlers => {
  const notifications = usePortalNotifications();
  const presentation = useNotificationPresentation();
  const moduleUnreadCount = useModuleUnreadCount(item.moduleId);
  const unreadCount =
    notifications && presentation ? moduleUnreadCount : undefined;
  const windowHref = useHref(
    item.moduleId === undefined ? "/" : getWindowHostPath(item.moduleId),
  );

  const showContextMenu = useContextMenu(
    moduleMenuBuilder as MenuBuilder,
    (action) => {
      const { moduleId } = item;
      if (action === SHOW_MODULE_NOTIFICATIONS && moduleId !== undefined) {
        presentation?.openPanel({ moduleIds: [moduleId] });
        return true;
      }
      if (
        action === MARK_MODULE_NOTIFICATIONS_READ &&
        moduleId !== undefined &&
        notifications
      ) {
        notifications.markRead(
          notifications.store
            .query({ moduleIds: [moduleId], read: false })
            .map(({ key }) => key),
        );
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
    },
  );

  const onContextMenu = useCallback<MouseEventHandler<HTMLElement>>(
    (event) => {
      showContextMenu(event, "portal-module", { unavailable, unreadCount });
    },
    [showContextMenu, unavailable, unreadCount],
  );

  const onKeyDown = useCallback<KeyboardEventHandler<HTMLElement>>(
    (event) => {
      if (
        event.key === "ContextMenu" ||
        (event.shiftKey && event.key === "F10")
      ) {
        const { left, bottom } = event.currentTarget.getBoundingClientRect();
        event.preventDefault();
        showContextMenu({ clientX: left, clientY: bottom }, "portal-module", {
          unavailable,
          unreadCount,
        });
      }
    },
    [showContextMenu, unavailable, unreadCount],
  );

  return item.moduleId === undefined ? {} : { onContextMenu, onKeyDown };
};
