import { useCallback, useRef } from "react";
import { Portal } from "../portal";
import MenuList, { MenuListProps } from "./MenuList";
import { useCascade } from "./use-cascade";
import { useClickAway } from "./use-click-away";
import { useItemsWithIdsNext } from "./use-items-with-ids-next";
import { useId } from "@finos/vuu-layout";

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
  const closeHandlerRef = useRef<ContextMenuProps["onClose"]>(onClose);
  closeHandlerRef.current = onClose;

  const id = useId(idProp);
  const closeMenuRef = useRef<(location?: string) => void>(noop);
  const [menus, actions] = useItemsWithIdsNext(childrenProp, id);
  const navigatingWithKeyboard = useRef(activatedByKeyboard);
  const handleMouseEnterItem = useCallback(() => {
    navigatingWithKeyboard.current = false;
  }, []);

  console.log({ actions, menus });

  const handleActivate = useCallback(
    (menuItemId: string) => {
      const actionId = menuItemId.slice(9);
      const { action, options } = actions[actionId];
      closeMenuRef.current(id);
      onClose(action, options);
    },
    [actions, id, onClose]
  );

  const { closeMenu, listItemProps, openMenu, openMenus, handleRender } =
    useCascade({
      // FIXME
      id: `${id}`,
      onActivate: handleActivate,
      onMouseEnterItem: handleMouseEnterItem,
      position,
    });
  closeMenuRef.current = closeMenu;

  const handleClose = useCallback(() => {
    closeMenu();
    onClose();
  }, [closeMenu, onClose]);

  useClickAway({
    containerClassName: "vuuMenuList",
    onClose: handleClose,
    isOpen: openMenus.length > 0,
  });

  const handleCloseMenu = () => {
    navigatingWithKeyboard.current = true;
    closeMenu();
  };

  const handleHighlightMenuItem = () => {
    // console.log(`highlight ${idx}`);
  };

  const lastMenu = openMenus.length - 1;

  const getChildMenuId = (i: number) => {
    if (i >= lastMenu) {
      return undefined;
    } else {
      const { id } = openMenus[i + 1];
      return id;
    }
  };

  // useEffect(() => () => onClose?.(), [onClose]);

  console.log({ menus, openMenus });

  return (
    <>
      {openMenus.map(({ id: menuId, left, top }, i, all) => {
        const childMenuId = getChildMenuId(i);
        // TODO don't need the portal here, vuu popup service takes care of this
        return (
          <Portal key={i} x={left} y={top} onRender={handleRender}>
            <MenuList
              {...menuListProps}
              activatedByKeyboard={navigatingWithKeyboard.current}
              childMenuShowing={childMenuId}
              className={className}
              id={menuId}
              isRoot={i === 0}
              key={i}
              listItemProps={listItemProps}
              onActivate={handleActivate}
              onHighlightMenuItem={handleHighlightMenuItem}
              onCloseMenu={handleCloseMenu}
              onOpenMenu={openMenu}
              style={style}
              tabIndex={i === all.length - 1 ? 0 : undefined}
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
