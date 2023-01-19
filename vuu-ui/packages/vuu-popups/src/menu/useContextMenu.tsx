// The menuBuilder will always be supplied by the code that will display the local
// context menu. It will be passed all configured menu descriptors. It is free to

import { MouseEvent, useCallback, useContext } from "react";
import { PopupService } from "../popup";
import {
  ContextMenuContext,
  ContextMenuItemDescriptor,
  isGroupMenuItem,
  MenuActionHandler,
} from "./context-menu-provider";
import { ContextMenu } from "./ContextMenu";
import { MenuItem, MenuItemGroup } from "./MenuList";

// augment, replace or ignore the existing menu descriptors.
export const useContextMenu = () => {
  const ctx = useContext(ContextMenuContext);
  // const { menuActionHandler, menuBuilders } = useContext(ContextMenuContext);

  const buildMenuOptions = useCallback((menuBuilders, location, options) => {
    let results: ContextMenuItemDescriptor[] = [];
    for (const menuBuilder of menuBuilders) {
      // Maybe we should leave the concatenation to the menuBuilder, then it can control menuItem order
      results = results.concat(menuBuilder(location, options));
    }
    return results;
  }, []);

  const handleShowContextMenu = useCallback(
    (e: MouseEvent<HTMLElement>, location: string, options: unknown) => {
      e.stopPropagation();
      e.preventDefault();
      const menuBuilders = ctx?.menuBuilders ?? [];
      const menuItemDescriptors = buildMenuOptions(
        menuBuilders,
        location,
        options
      );
      console.log({
        menuItemDescriptors,
      });
      if (menuItemDescriptors.length && ctx?.menuActionHandler) {
        console.log(`showContextMenu ${location}`, {
          options,
        });
        showContextMenu(e, menuItemDescriptors, ctx.menuActionHandler);
      }
    },
    [buildMenuOptions, ctx]
  );

  return handleShowContextMenu;
};

const showContextMenu = (
  e: MouseEvent<HTMLElement>,
  menuDescriptors: ContextMenuItemDescriptor[],
  handleContextMenuAction: MenuActionHandler
) => {
  const { clientX: left, clientY: top } = e;
  const menuItems = (menuDescriptors: ContextMenuItemDescriptor[]) => {
    const fromDescriptor = (menuItem: ContextMenuItemDescriptor, i: number) =>
      isGroupMenuItem(menuItem) ? (
        <MenuItemGroup key={i} label={menuItem.label}>
          {menuItem.children.map(fromDescriptor)}
        </MenuItemGroup>
      ) : (
        <MenuItem
          key={i}
          action={menuItem.action}
          data-icon={menuItem.icon}
          options={menuItem.options}
        >
          {menuItem.label}
        </MenuItem>
      );

    return menuDescriptors.map(fromDescriptor);
  };

  const handleClose = (menuId?: string, options?: unknown) => {
    if (menuId) {
      handleContextMenuAction(menuId, options);
      PopupService.hidePopup();
    }
  };

  const component = (
    <ContextMenu onClose={handleClose} position={{ x: left, y: top }}>
      {menuItems(menuDescriptors)}
    </ContextMenu>
  );
  PopupService.showPopup({ left: 0, top: 0, component });
};
