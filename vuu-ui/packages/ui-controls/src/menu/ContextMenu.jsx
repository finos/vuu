import React, { useCallback, useRef } from 'react';
import { useId } from '@vuu-ui/react-utils';
import { Portal } from '@vuu-ui/theme';

import { useItemsWithIds } from './use-items-with-ids';
import { getItemId, getMenuId, useCascade } from './use-cascade';

import MenuList from './MenuList';

import './ContextMenu.css';
import { useClickAway } from './use-click-away';

const ContextMenu = ({
  activatedWithKeyboard = false,
  children: childrenProp,
  id: idProp,
  onClose = () => undefined,
  position = { x: 0, y: 0 },
  source: sourceProp,
  style
}) => {
  const id = useId(idProp);
  const closeMenuRef = useRef(null);
  const [menus, actions] = useItemsWithIds(sourceProp, childrenProp);
  const navigatingWithKeyboard = useRef(activatedWithKeyboard);
  const handleMouseEnterItem = useCallback(() => {
    navigatingWithKeyboard.current = false;
  }, []);

  const handleActivate = useCallback(
    (menuId) => {
      const { action, options } = actions[menuId];
      closeMenuRef.current('root');
      onClose(action, options);
    },
    [actions, onClose]
  );

  const { closeMenu, listItemProps, openMenu, openMenus, handleRender } = useCascade({
    id,
    onActivate: handleActivate,
    onMouseEnterItem: handleMouseEnterItem,
    position
  });
  closeMenuRef.current = closeMenu;

  console.log({ openMenus });

  const handleClose = useCallback(() => {
    closeMenu();
    onClose();
  }, [closeMenu, onClose]);

  useClickAway({
    containerClassName: 'hwMenuList',
    onClose: handleClose,
    isOpen: openMenus.length > 0
  });

  const handleOpenMenu = (id) => {
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

  const getChildMenuIndex = (i) => {
    if (i >= lastMenu) {
      return -1;
    } else {
      const { id: menuId } = openMenus[i + 1];
      const pos = menuId.lastIndexOf('.');
      const idx = pos === -1 ? parseInt(menuId, 10) : parseInt(menuId.slice(-pos), 10);
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
              activatedByKeyboard={navigatingWithKeyboard.current}
              childMenuShowing={childMenuIndex}
              id={id}
              menuId={menuId}
              isRoot={i === 0}
              key={i}
              listItemProps={listItemProps}
              onActivate={handleActivate}
              onHighlightMenuItem={handleHighlightMenuItem}
              onCloseMenu={handleCloseMenu}
              onOpenMenu={handleOpenMenu}
              style={style}>
              {menus[menuId]}
            </MenuList>
          </Portal>
        );
      })}
    </>
  );
};

ContextMenu.displayName = 'ContextMenu';
export default ContextMenu;
