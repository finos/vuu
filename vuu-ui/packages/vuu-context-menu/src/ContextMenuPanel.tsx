import { MenuPanel, MenuPanelProps } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { MenuActionHandler } from "./ContextMenuProvider";
import {
  ContextMenuItemDescriptor,
  menuItemsFromMenuDescriptors,
} from "./menu-utils";

import contextMenuCss from "./ContextMenu.css";

export interface ContextMenuPanelProps
  extends Omit<MenuPanelProps, "children"> {
  menuHandler: MenuActionHandler;
  menuItemDescriptors: ContextMenuItemDescriptor[];
}

/**
 * A Salt MenuPanel populated from menu item descriptors. Render it inside a
 * Salt Menu.
 */
export const ContextMenuPanel = ({
  className,
  menuHandler,
  menuItemDescriptors,
  ...menuPanelProps
}: ContextMenuPanelProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-context-menu",
    css: contextMenuCss,
    window: targetWindow,
  });

  return (
    <MenuPanel
      {...menuPanelProps}
      className={cx("vuuContextMenuPanel", className)}
    >
      {menuItemsFromMenuDescriptors(menuItemDescriptors, menuHandler)}
    </MenuPanel>
  );
};
