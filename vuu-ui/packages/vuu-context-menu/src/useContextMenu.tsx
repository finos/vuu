import { useCallback, useContext } from "react";
import { ContextMenu, ContextMenuProps } from "./ContextMenu";
import {
  ContextMenuContext,
  MenuActionHandler,
  MenuBuilder,
} from "./ContextMenuProvider";
import { ContextMenuItemDescriptor } from "./menu-utils";

export type EventLike = {
  clientX: number;
  clientY: number;
  preventDefault?: () => void;
  stopPropagation?: () => void;
};

export type ShowContextMenu = (
  e: EventLike,
  location: string,
  options: unknown,
  contextMenuProps?: Partial<
    Pick<ContextMenuProps, "onOpenChange" | "x" | "y">
  >,
) => boolean;

// The argument allows a top-level menuBuilder to operate outside the Context
export const useContextMenu = (
  menuBuilder?: MenuBuilder,
  menuActionHandler?: MenuActionHandler,
): ShowContextMenu => {
  const ctx = useContext(ContextMenuContext);

  const buildMenuOptions = useCallback(
    (menuBuilders: MenuBuilder[], location: string, options: unknown) => {
      let results: ContextMenuItemDescriptor[] = [];
      for (const menuBuilder of menuBuilders) {
        // Maybe we should leave the concatenation to the menuBuilder, then it can control menuItem order
        results = results.concat(menuBuilder(location, options));
      }
      return results;
    },
    [],
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        ctx?.showContextMenu(null);
      }
    },
    [ctx],
  );

  const showContextMenu = useCallback<ShowContextMenu>(
    (
      evt,
      location,
      options,
      { onOpenChange, x = evt.clientX, y = evt.clientY } = {
        x: evt.clientX,
        y: evt.clientY,
      },
    ) => {
      evt.stopPropagation?.();
      evt.preventDefault?.();

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
          options,
        );

        const menuHandler: MenuActionHandler = (menuItemId, options) => {
          if (menuActionHandler?.(menuItemId, options) === true) {
            return true;
          } else {
            return ctx?.menuActionHandler(menuItemId, options);
          }
        };

        const localOpenChange = (isOpen: boolean) => {
          onOpenChange?.(isOpen);
          handleOpenChange(isOpen);
        };

        if (menuItemDescriptors.length) {
          ctx?.showContextMenu(
            <ContextMenu
              menuHandler={menuHandler}
              menuItemDescriptors={menuItemDescriptors}
              onOpenChange={localOpenChange}
              open={true}
              x={x}
              y={y}
            />,
          );
          return true;
        }
      } else {
        console.warn(
          "useContextMenu, no menuBuilders configured. These should be supplied via the ContextMenuProvider(s)",
        );
      }
      return false;
    },
    [buildMenuOptions, ctx, handleOpenChange, menuActionHandler, menuBuilder],
  );

  return showContextMenu;
};
