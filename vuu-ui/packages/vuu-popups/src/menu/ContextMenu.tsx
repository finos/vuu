import { useIdMemo as useId } from "@salt-ds/core";
import { useCallback, useRef } from "react";
import { Portal } from "../portal";
import MenuList, { MenuListProps } from "./MenuList";
import { useItemsWithIds } from "./use-items-with-ids";
import { getItemId, getMenuId, useCascade } from "./use-cascade";

import "./ContextMenu.css";
import { useClickAway } from "./use-click-away";

export interface ContextMenuProps extends Omit<MenuListProps, "onCloseMenu"> {
  onClose?: (menuId?: string, options?: unknown) => void;
  position?: { x: number; y: number };
  withPortal?: boolean;
}

const noop = () => undefined;

export const ContextMenu = ({
  activatedByKeyboard,
  children: childrenProp,
  className,
  id: idProp,
  onClose = () => undefined,
  position = { x: 0, y: 0 },
  style,
  ...menuListProps
}: ContextMenuProps) => {
  const id = useId(idProp);
  const closeMenuRef = useRef<(location?: string) => void>(noop);
  const [menus, actions] = useItemsWithIds(childrenProp);
  const navigatingWithKeyboard = useRef(activatedByKeyboard);
  const handleMouseEnterItem = useCallback(() => {
    navigatingWithKeyboard.current = false;
  }, []);

  const handleActivate = useCallback(
    (menuId: string) => {
      const { action, options } = actions[menuId];
      closeMenuRef.current("root");
      onClose(action, options);
    },
    [actions, onClose]
  );

  const { closeMenu, listItemProps, openMenu, openMenus, handleRender } =
    useCascade({
      id,
      onActivate: handleActivate,
      onMouseEnterItem: handleMouseEnterItem,
      position,
    });
  closeMenuRef.current = closeMenu;

  console.log({ openMenus });

  const handleClose = useCallback(() => {
    closeMenu();
    onClose();
  }, [closeMenu, onClose]);

  useClickAway({
    containerClassName: "vuuMenuList",
    onClose: handleClose,
    isOpen: openMenus.length > 0,
  });

  const handleOpenMenu = (id: string) => {
    const itemId = getItemId(id);
    const menuId = getMenuId(itemId);
    navigatingWithKeyboard.current = true;
    openMenu(menuId, itemId);
  };
  const handleCloseMenu = () => {
    navigatingWithKeyboard.current = true;
    closeMenu();
  };

  const handleHighlightMenuItem = () => {
    // console.log(`highlight ${idx}`);
  };

  const lastMenu = openMenus.length - 1;

  const getChildMenuIndex = (i: number) => {
    if (i >= lastMenu) {
      return -1;
    } else {
      const { id: menuId } = openMenus[i + 1];
      const pos = menuId.lastIndexOf(".");
      const idx =
        pos === -1 ? parseInt(menuId, 10) : parseInt(menuId.slice(-pos), 10);
      return idx;
    }
  };

  return (
    <>
      {openMenus.map(({ id: menuId, left, top }, i) => {
        const childMenuIndex = getChildMenuIndex(i);

        return (
          <Portal key={i} x={left} y={top} onRender={handleRender}>
            <MenuList
              {...menuListProps}
              activatedByKeyboard={navigatingWithKeyboard.current}
              childMenuShowing={childMenuIndex}
              className={className}
              id={id}
              menuId={menuId}
              isRoot={i === 0}
              key={i}
              listItemProps={listItemProps}
              onActivate={handleActivate}
              onHighlightMenuItem={handleHighlightMenuItem}
              onCloseMenu={handleCloseMenu}
              onOpenMenu={handleOpenMenu}
              style={style}
            >
              {menus[menuId]}
            </MenuList>
          </Portal>
        );
      })}
    </>
  );
};

ContextMenu.displayName = "ContextMenu";
