import { VirtualElement } from "@floating-ui/dom";
import { Menu, MenuProps } from "@salt-ds/core";
import { ContextMenuPanel } from "./ContextMenuPanel";
import { MenuActionHandler } from "./ContextMenuProvider";
import { ContextMenuItemDescriptor } from "./menu-utils";

export interface ContextMenuProps
  extends Pick<MenuProps, "open" | "onOpenChange"> {
  className?: string;
  menuHandler: MenuActionHandler;
  menuItemDescriptors: ContextMenuItemDescriptor[];
  x: number;
  y: number;
}

export const ContextMenu = ({
  className,
  menuHandler,
  menuItemDescriptors,
  onOpenChange,
  open,
  x,
  y,
}: ContextMenuProps) => {
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
      <ContextMenuPanel
        className={className}
        menuHandler={menuHandler}
        menuItemDescriptors={menuItemDescriptors}
      />
    </Menu>
  );
};
