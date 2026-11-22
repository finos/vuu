import { useCallback, useContext } from "react";
import {
  ContextMenuContext,
  MenuActionHandler,
  MenuBuilder,
} from "./ContextMenuProvider";
import { ContextMenuItemDescriptor } from "./menu-utils";

export interface ContextMenuItems {
  menuHandler: MenuActionHandler;
  menuItemDescriptors: ContextMenuItemDescriptor[];
}

export type BuildContextMenuItems = (
  location: string,
  options: unknown,
) => ContextMenuItems;

/**
 * Returns a function that builds the menu items for a location, from the
 * given menuBuilder followed by those of any enclosing ContextMenuProviders.
 * The returned menuHandler tries the given menuActionHandler, then the
 * providers' handlers.
 */
export const useContextMenuItems = (
  menuBuilder?: MenuBuilder,
  menuActionHandler?: MenuActionHandler,
): BuildContextMenuItems => {
  const ctx = useContext(ContextMenuContext);

  return useCallback<BuildContextMenuItems>(
    (location, options) => {
      const menuBuilders: MenuBuilder[] = [];
      if (menuBuilder) {
        menuBuilders.push(menuBuilder);
      }
      if (Array.isArray(ctx?.menuBuilders)) {
        menuBuilders.push(...ctx.menuBuilders);
      }

      const menuItemDescriptors = menuBuilders.flatMap((builder) =>
        builder(location, options),
      );

      const menuHandler: MenuActionHandler = (menuItemId, options) => {
        if (menuActionHandler?.(menuItemId, options) === true) {
          return true;
        } else {
          return ctx?.menuActionHandler(menuItemId, options);
        }
      };

      return { menuHandler, menuItemDescriptors };
    },
    [ctx, menuActionHandler, menuBuilder],
  );
};
