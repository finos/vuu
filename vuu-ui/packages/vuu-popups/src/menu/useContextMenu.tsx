import {
  ContextMenuItemDescriptor,
  MenuActionHandler,
  MenuBuilder,
} from "@finos/vuu-data-types";
import { useThemeAttributes } from "@finos/vuu-shell";
import { isGroupMenuItemDescriptor } from "@finos/vuu-utils";
import cx from "classnames";
import { cloneElement, MouseEvent, useCallback, useContext } from "react";
import {
  MenuActionClosePopup,
  PopupCloseReason,
  PopupService,
  reasonIsMenuAction,
} from "../popup";
import { ContextMenu, ContextMenuProps } from "./ContextMenu";
import { MenuItem, MenuItemGroup } from "./MenuList";
import { ContextMenuContext } from "./context-menu-provider";

export type ContextMenuOptions = {
  [key: string]: unknown;
  contextMenu?: JSX.Element;
  ContextMenuProps?: Partial<ContextMenuProps> & {
    className?: string;
    "data-mode"?: string;
  };
  controlledComponentId?: string;
};

export type ShowContextMenu = (
  e: MouseEvent<HTMLElement>,
  location: string,
  options: ContextMenuOptions
) => void;

// The argument allows a top-level menuBuilder to operate outside the Context
export const useContextMenu = (
  menuBuilder?: MenuBuilder,
  menuActionHandler?: MenuActionHandler
): [ShowContextMenu, () => void] => {
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
      { ContextMenuProps, contextMenu, ...options }: ContextMenuOptions
    ) => {
      e.stopPropagation();
      e.preventDefault();

      if (contextMenu) {
        return showContextMenuComponent(e, contextMenu);
      }

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

        // const menuHandler = menuActionHandler ?? ctx?.menuActionHandler;
        const menuHandler: MenuActionHandler = (
          action: MenuActionClosePopup
        ) => {
          if (menuActionHandler?.(action) === true) {
            return true;
          } else {
            return ctx?.menuActionHandler(action);
          }
        };

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

  const hideContextMenu = useCallback(() => {
    console.log("hide comnytext menu");
  }, []);

  return [handleShowContextMenu, hideContextMenu];
};

const NO_OPTIONS = {};

const showContextMenuComponent = (
  e: MouseEvent<HTMLElement>,
  contextMenu: JSX.Element
) => {
  const position = {
    x: e.clientX,
    y: e.clientY,
  };

  PopupService.showPopup({
    focus: true,
    left: 0,
    top: 0,
    component: cloneElement(contextMenu, { position }),
  });
};

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

  const handleClose = (reason?: PopupCloseReason) => {
    if (reasonIsMenuAction(reason)) {
      handleContextMenuAction(reason);
      // TODO this results in onClose being called twice on component
      // cant simply be removed, some refactoring work needed
      PopupService.hidePopup();
    }
    contextMenuProps?.onClose?.(reason);
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
  PopupService.showPopup({ left: 0, top: 0, component, focus: true });
};
