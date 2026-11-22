import { useCallback, useContext } from "react";
import { ContextMenu, ContextMenuProps } from "./ContextMenu";
import {
  ContextMenuContext,
  MenuActionHandler,
  MenuBuilder,
} from "./ContextMenuProvider";
import { useContextMenuItems } from "./useContextMenuItems";

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
    Pick<ContextMenuProps, "className" | "onOpenChange" | "x" | "y">
  >,
) => boolean;

// The argument allows a top-level menuBuilder to operate outside the Context
export const useContextMenu = (
  menuBuilder?: MenuBuilder,
  menuActionHandler?: MenuActionHandler,
): ShowContextMenu => {
  const ctx = useContext(ContextMenuContext);
  const buildMenuItems = useContextMenuItems(menuBuilder, menuActionHandler);

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
      { className, onOpenChange, x = evt.clientX, y = evt.clientY } = {
        x: evt.clientX,
        y: evt.clientY,
      },
    ) => {
      evt.stopPropagation?.();
      evt.preventDefault?.();

      if (!menuBuilder && !ctx?.menuBuilders?.length) {
        console.warn(
          "useContextMenu, no menuBuilders configured. These should be supplied via the ContextMenuProvider(s)",
        );
        return false;
      }

      const { menuHandler, menuItemDescriptors } = buildMenuItems(
        location,
        options,
      );

      const localOpenChange = (isOpen: boolean) => {
        onOpenChange?.(isOpen);
        handleOpenChange(isOpen);
      };

      if (menuItemDescriptors.length) {
        ctx?.showContextMenu(
          <ContextMenu
            className={className}
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
      return false;
    },
    [buildMenuItems, ctx, handleOpenChange, menuBuilder],
  );

  return showContextMenu;
};
