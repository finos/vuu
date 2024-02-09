import { useId } from "@finos/vuu-utils";
import { useCallback, useRef } from "react";
import { PopupCloseCallback, PopupComponent } from "../popup";
import { Portal, PortalProps } from "../portal";
import { MenuList, MenuListProps } from "./MenuList";
import { useCascade } from "./use-cascade";
import { useItemsWithIdsNext } from "./use-items-with-ids-next";
import { MenuCloseHandler } from "./use-keyboard-navigation";
import { ContextMenuOptions } from "./useContextMenu";

export interface ContextMenuProps extends Omit<MenuListProps, "onCloseMenu"> {
  PortalProps?: Partial<PortalProps>;
  onClose?: PopupCloseCallback;
  position?: { x: number; y: number };
  withPortal?: boolean;
}

const noop = () => undefined;

export const ContextMenu = ({
  PortalProps,
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
  const [menus, actions] = useItemsWithIdsNext(childrenProp, id);
  const navigatingWithKeyboard = useRef(activatedByKeyboard);
  const handleMouseEnterItem = useCallback(() => {
    navigatingWithKeyboard.current = false;
  }, []);

  const handleActivate = useCallback(
    (menuItemId: string) => {
      const actionId = menuItemId.slice(9);
      const { action, options } = actions[actionId];
      closeMenuRef.current(id);
      onClose({
        type: "menu-action",
        menuId: action,
        options: options as ContextMenuOptions,
      });
    },
    [actions, id, onClose]
  );

  const {
    closeMenu,
    listItemProps,
    openMenu: onOpenMenu,
    openMenus,
    handleRender,
  } = useCascade({
    // FIXME
    id: `${id}`,
    onActivate: handleActivate,
    onMouseEnterItem: handleMouseEnterItem,
    position,
  });
  closeMenuRef.current = closeMenu;

  const handleCloseMenu = useCallback<MenuCloseHandler>(
    (evt, reason) => {
      navigatingWithKeyboard.current = true;
      closeMenu();
      if (reason === "tab-away") {
        // TODO we should fire onclose whenever we're closing
        // the root menu, not just on Tab
        onClose({
          event: evt,
          type: "tab-away",
        });
      }
    },
    [closeMenu, onClose]
  );

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

  return (
    <>
      {openMenus.map(({ id: menuId, left, top }, i, all) => {
        const childMenuId = getChildMenuId(i);
        return (
          <Portal {...PortalProps} key={i} onRender={handleRender}>
            <PopupComponent
              anchorElement={{ current: document.body }}
              placement="absolute"
              position={{ left, top }}
            >
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
                openMenu={onOpenMenu}
                style={style}
                tabIndex={i === all.length - 1 ? 0 : undefined}
              >
                {menus[menuId]}
              </MenuList>
            </PopupComponent>
          </Portal>
        );
      })}
    </>
  );
};

ContextMenu.displayName = "ContextMenu";
