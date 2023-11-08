import {
  ContextMenuItemDescriptor,
  MenuActionHandler,
  MenuBuilder,
} from "@finos/vuu-data-types";
import { isGroupMenuItemDescriptor } from "@finos/vuu-utils";
import { cloneElement, useCallback, useContext, useMemo } from "react";
import {
  MenuActionClosePopup,
  PopupCloseReason,
  PopupService,
  reasonIsMenuAction,
} from "../popup";
import { ContextMenu, ContextMenuProps } from "./ContextMenu";
import { MenuItem, MenuItemGroup } from "./MenuList";
import { ContextMenuContext } from "./context-menu-provider";
import { useThemeAttributes } from "@finos/vuu-shell";

export type ContextMenuOptions = {
  [key: string]: unknown;
  contextMenu?: JSX.Element;
  ContextMenuProps?: Partial<ContextMenuProps> & {
    className?: string;
  };
  controlledComponentId?: string;
};

export type EventLike = {
  clientX: number;
  clientY: number;
  preventDefault?: () => void;
  stopPropagation?: () => void;
};

export type ShowContextMenu = (
  e: EventLike,
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
  const themeAttributes = useMemo(
    () => ({
      themeClass,
      densityClass,
      dataMode,
    }),
    [dataMode, densityClass, themeClass]
  );

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

  const handleShowContextMenu = useCallback<ShowContextMenu>(
    (e, location, { ContextMenuProps, contextMenu, ...options }) => {
      e.stopPropagation?.();
      e.preventDefault?.();

      if (contextMenu) {
        return showContextMenuComponent(
          {
            x: e.clientX,
            y: e.clientY,
          },
          contextMenu
        );
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
          // because showPopup is going to be used to render the context menu, it will not
          // have access to the ContextMenuContext. Pass the theme attributes here
          showContextMenu(e, menuItemDescriptors, menuHandler, {
            PortalProps: {
              themeAttributes,
            },
            ...ContextMenuProps,
          });
        }
      } else {
        console.warn(
          "useContextMenu, no menuBuilders configured. These should be supplied via the ContextMenuProvider(s)"
        );
      }
    },
    [buildMenuOptions, ctx, menuActionHandler, menuBuilder, themeAttributes]
  );

  const hideContextMenu = useCallback(() => {
    console.log("hide context menu");
  }, []);

  return [handleShowContextMenu, hideContextMenu];
};

const NO_OPTIONS = {};

const showContextMenuComponent = (
  position: { x: number; y: number },
  contextMenu: JSX.Element
) => {
  PopupService.showPopup({
    focus: true,
    left: 0,
    top: 0,
    component: cloneElement(contextMenu, { position }),
  });
};

const showContextMenu = (
  e: EventLike,
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
          className={menuItem.className}
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
