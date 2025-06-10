import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { VirtualElement } from "@floating-ui/dom";
import {
  ContextMenuItemDescriptor,
  menuItemsFromMenuDescriptors,
} from "./menu-utils";

import contextMenuCss from "./ContextMenu.css";
import { MenuActionHandler } from "./ContextMenuProvider";
import { Menu, MenuPanel, MenuProps } from "@salt-ds/core";

export interface ContextMenuProps
  extends Pick<MenuProps, "open" | "onOpenChange"> {
  menuHandler: MenuActionHandler;
  menuItemDescriptors: ContextMenuItemDescriptor[];
  x: number;
  y: number;
}

export const ContextMenu = ({
  menuHandler,
  menuItemDescriptors,
  onOpenChange,
  open,
  x,
  y,
}: ContextMenuProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-context-menu",
    css: contextMenuCss,
    window: targetWindow,
  });

  const virtualElement: VirtualElement = {
    getBoundingClientRect: () => ({
      width: 0,
      height: 0,
      x,
      y,
      top: y,
      right: x,
      bottom: y,
      left: x,
    }),
  };

  return (
    <Menu
      getVirtualElement={() => virtualElement}
      onOpenChange={onOpenChange}
      open={open}
    >
      <MenuPanel className="vuuContextMenuPanel">
        {menuItemsFromMenuDescriptors(menuItemDescriptors, menuHandler)}
      </MenuPanel>
    </Menu>
  );
};
