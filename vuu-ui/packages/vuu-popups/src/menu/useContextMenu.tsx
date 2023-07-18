// The menuBuilder will always be supplied by the code that will display the local
// context menu. It will be passed all configured menu descriptors. It is free to

import { ContextMenuItemDescriptor } from "@finos/vuu-data-types";
import { useThemeAttributes } from "@finos/vuu-shell";
import { isGroupMenuItemDescriptor } from "@finos/vuu-utils";
import cx from "classnames";
import { MouseEvent, useCallback, useContext } from "react";
import { PopupService } from "../popup";
import { MenuActionHandler, MenuBuilder } from "@finos/vuu-data-types";
import { ContextMenu, ContextMenuProps } from "./ContextMenu";
import { MenuItem, MenuItemGroup } from "./MenuList";
import { ContextMenuContext } from "./context-menu-provider";

export type ContextMenuOptions = {
  [key: string]: unknown;
  ContextMenuProps?: Partial<ContextMenuProps> & {
    className?: string;
    "data-mode"?: string;
  };
};

// The argument allows a top-level menuBuilder to operate outside the Context
export const useContextMenu = (
  menuBuilder?: MenuBuilder,
  menuActionHandler?: MenuActionHandler
) => {
  const ctx = useContext(ContextMenuContext);
  const [themeClass, densityClass, dataMode] = useThemeAttributes();

  const buildMenuOptions = useCallback(
    (menuBuilders: MenuBuilder[], location, options) => {
      let results: ContextMenuItemDescriptor[] = [];
      for (const menuBuilder of menuBuilders) {
        // Maybe we should leave the concatenation to the menuBuilder, then it can control menuItem order
        results = results.concat(menuBuilder(location, options));
      }
      return results;
    },
    []
  );

  const handleShowContextMenu = useCallback(
    (
      e: MouseEvent<HTMLElement>,
      location: string,
      { ContextMenuProps, ...options }: ContextMenuOptions
    ) => {
      e.stopPropagation();
      e.preventDefault();

      const menuBuilders: MenuBuilder[] = [];
      if (menuBuilder) {
        menuBuilders.push(menuBuilder);
      }
      if (
        ctx &&
        Array.isArray(ctx?.menuBuilders) &&
        ctx.menuBuilders.length > 0
      ) {
        menuBuilders.push(...ctx.menuBuilders);
      }

      if (menuBuilders.length > 0) {
        const menuItemDescriptors = buildMenuOptions(
          menuBuilders,
          location,
          options
        );

        const menuHandler = menuActionHandler ?? ctx?.menuActionHandler;

        if (menuItemDescriptors.length && menuHandler) {
          console.log(`showContextMenu ${location}`, {
            options,
          });
          showContextMenu(e, menuItemDescriptors, menuHandler, {
            ...ContextMenuProps,
            className: cx(
              ContextMenuProps?.className,
              themeClass,
              densityClass
            ),
            "data-mode": dataMode,
          });
        }
      } else {
        console.warn(
          "useContextMenu, no menuBuilders configured. These should be supplied via the ContextMenuProvider(s)"
        );
      }
    },
    [
      buildMenuOptions,
      ctx,
      dataMode,
      densityClass,
      menuActionHandler,
      menuBuilder,
      themeClass,
    ]
  );

  return handleShowContextMenu;
};

const NO_OPTIONS = {};

const showContextMenu = (
  e: MouseEvent<HTMLElement>,
  menuDescriptors: ContextMenuItemDescriptor[],
  handleContextMenuAction: MenuActionHandler,
  {
    position: positionProp,
    ...contextMenuProps
  }: ContextMenuOptions["ContextMenuProps"] = NO_OPTIONS
) => {
  const menuItems = (menuDescriptors: ContextMenuItemDescriptor[]) => {
    const fromDescriptor = (menuItem: ContextMenuItemDescriptor, i: number) =>
      isGroupMenuItemDescriptor(menuItem) ? (
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
    contextMenuProps?.onClose?.(menuId);
  };

  const position = positionProp ?? {
    x: e.clientX,
    y: e.clientY,
  };

  const component = (
    <ContextMenu
      {...contextMenuProps}
      onClose={handleClose}
      position={position}
    >
      {menuItems(menuDescriptors)}
    </ContextMenu>
  );
  PopupService.showPopup({ left: 0, top: 0, component });
};
