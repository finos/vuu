import { useCallback, useMemo, useRef, useState } from 'react';

import { closestListItem, listItemIndex } from '../common-hooks';
// import {mousePosition} from './aim/utils';
// import {aiming} from './aim/aim';

const nudge = (menus, distance, pos) => {
  return menus.map((m, i) =>
    i === menus.length - 1
      ? {
          ...m,
          [pos]: m[pos] - distance
        }
      : m
  );
};
const nudgeLeft = (menus, distance) => nudge(menus, distance, 'left');
const nudgeUp = (menus, distance) => nudge(menus, distance, 'top');

const flipSides = (id, menus) => {
  const [parentMenu, menu] = menus.slice(-2);
  const el = document.getElementById(`${id}-${menu.id}`);
  const { width } = el.getBoundingClientRect();
  return menus.map((m) =>
    m === menu
      ? {
          ...m,
          left: parentMenu.left - (width - 2)
        }
      : m
  );
};

const closedNode = (el) => el.ariaHasPopup === 'true' && el.ariaExpanded !== 'true';
const getPosition = (el, openMenus) => {
  const [{ left, top: menuTop }] = openMenus.slice(-1);
  // const {top, right, bottom, left} = el.getBoundingClientRect();
  // this will not work for MenuList within window, we need the
  // const {offsetLeft: left, offsetTop: menuTop} = el.closest('.hwMenuList');
  const { offsetWidth: width, offsetTop: top } = el;
  return { left: left + width, top: top + menuTop };
};

export const getItemId = (id) => {
  let pos = id.lastIndexOf('-');
  return pos === -1 ? id : id.slice(pos + 1);
};

export const getMenuId = (id) => {
  const itemId = getItemId(id);
  const pos = itemId.lastIndexOf('.');
  return pos > -1 ? itemId.slice(0, pos) : 'root';
};

const getMenuDepth = (id) => {
  let count = 0,
    pos = id.indexOf('.', 0);
  while (pos !== -1) {
    count += 1;
    pos = id.indexOf('.', pos + 1);
  }
  return count;
};
const identifyItem = (el) => [
  getMenuId(el.id),
  getItemId(el.id),
  el.ariaHasPopup === 'true',
  el.ariaExpanded === 'true',
  getMenuDepth(el.id)
];

export const useCascade = ({
  id,
  onActivate,
  onMouseEnterItem,
  position: { x: posX, y: posY }
}) => {
  const [, forceRefresh] = useState({});
  const openMenus = useRef([{ id: 'root', left: posX, top: posY }]);

  const setOpenMenus = useCallback((menus) => {
    openMenus.current = menus;
    forceRefresh({});
  }, []);

  const menuOpenPendingTimeout = useRef(null);
  const menuClosePendingTimeout = useRef(null);
  const menuState = useRef({ root: 'no-popup' });
  const prevLevel = useRef(0);

  // const prevAim = useRef({mousePos: null, distance: true});

  const openMenu = useCallback(
    (menuId = 'root', itemId = null, listItemEl = null) => {
      if (menuId === 'root' && itemId === null) {
        setOpenMenus([{ id: 'root', left: posX, top: posY }]);
      } else {
        menuState.current[menuId] = 'popup-open';
        const doc = listItemEl ? listItemEl.ownerDocument : document;
        const el = doc.getElementById(`${id}-${menuId}-${itemId}`);
        const { left, top } = getPosition(el, openMenus.current);
        setOpenMenus(openMenus.current.concat({ id: itemId, left, top }));
      }
    },
    [id, posX, posY, setOpenMenus]
  );

  const closeMenu = useCallback(
    (menuId) => {
      if (menuId === 'root') {
        setOpenMenus([]);
      } else {
        setOpenMenus(openMenus.current.slice(0, -1));
      }
    },
    [setOpenMenus]
  );

  const closeMenus = useCallback(
    (menuId, itemId) => {
      const menus = openMenus.current.slice();
      let { id: lastMenuId } = menus[menus.length - 1];
      while (menus.length > 1 && !itemId.startsWith(lastMenuId)) {
        const parentMenuId = getMenuId(lastMenuId);
        menus.pop();
        menuState.current[lastMenuId] = 'no-popup';
        menuState.current[parentMenuId] = 'no-popup';
        ({ id: lastMenuId } = menus[menus.length - 1]);
      }
      if (menus.length < openMenus.current.length) {
        setOpenMenus(menus);
      }
    },
    [setOpenMenus]
  );

  const scheduleOpen = useCallback(
    (menuId, itemId, listItemEl) => {
      if (menuOpenPendingTimeout.current) {
        clearTimeout(menuOpenPendingTimeout.current);
      }
      menuOpenPendingTimeout.current = setTimeout(() => {
        console.log(`scheduleOpen timed out opening ${itemId}`);
        closeMenus(menuId, itemId);
        menuState.current[menuId] = 'popup-open';
        menuState.current[itemId] = 'no-popup';
        openMenu(menuId, itemId, listItemEl);
      }, 400);
    },
    [closeMenus, openMenu]
  );

  const scheduleClose = useCallback(
    (openMenuId, menuId, itemId) => {
      console.log(`scheduleClose openMenuId ${openMenuId} menuId ${menuId} itemId ${itemId}`);
      menuState.current[openMenuId] = 'pending-close';
      menuClosePendingTimeout.current = setTimeout(() => {
        closeMenus(menuId, itemId);
      }, 400);
    },
    [closeMenus]
  );

  const handleRender = useCallback(() => {
    const { current: menus } = openMenus;
    const [menu] = menus.slice(-1);
    const el = document.getElementById(`${id}-${menu.id}`);
    if (el) {
      const { right, bottom } = el.getBoundingClientRect();
      const { clientHeight, clientWidth } = document.body;
      if (right > clientWidth) {
        const newMenus =
          menus.length > 1 ? flipSides(id, menus) : nudgeLeft(menus, right - clientWidth);
        setOpenMenus(newMenus);
      } else if (bottom > clientHeight) {
        const newMenus = nudgeUp(menus, bottom - clientHeight);
        setOpenMenus(newMenus);
      }
    }
  }, [id, setOpenMenus]);

  const listItemProps = useMemo(
    () => ({
      onMouseEnter: (evt) => {
        const listItemEl = closestListItem(evt.target);
        const [menuId, itemId, isGroup, isOpen, level] = identifyItem(listItemEl);
        const sameLevel = prevLevel.current === level;
        const {
          current: { [menuId]: state }
        } = menuState;
        prevLevel.current = level;

        // console.log(
        //   `%conMouseEnter #${menuId}[${itemId}] @${level}
        //     isGroup ${isGroup} isOpen ${isOpen}
        //     openMenus [${openMenus.current.join(',')}]
        //     state='${JSON.stringify(menuState.current)}`,
        //     'color: green; font-weight: bold;'
        // );

        if (state === 'no-popup' && isGroup) {
          // Shouldn;t we always set this ?
          menuState.current[menuId] = 'popup-pending';
          scheduleOpen(menuId, itemId, listItemEl);
        } else if (state === 'popup-pending' && !isGroup) {
          menuState.current[menuId] = 'no-popup';
          clearTimeout(menuOpenPendingTimeout.current);
          menuOpenPendingTimeout.current = null;
        } else if (state === 'popup-pending' && isGroup) {
          clearTimeout(menuOpenPendingTimeout.current);
          scheduleOpen(menuId, itemId, listItemEl);
        } else if (state === 'popup-open') {
          const [{ id: parentMenuId }, { id: openMenuId }] = openMenus.current.slice(-2);
          if (
            parentMenuId === menuId &&
            menuState.current[openMenuId] !== 'pending-close' &&
            sameLevel
          ) {
            scheduleClose(openMenuId, menuId, itemId);
            if (isGroup && !isOpen) {
              scheduleOpen(menuId, itemId, listItemEl);
            }
          } else if (
            parentMenuId === menuId &&
            isGroup &&
            itemId !== openMenuId &&
            menuState.current[openMenuId] === 'pending-close'
          ) {
            // if there is already an item queued for opening cancel it
            scheduleOpen(menuId, itemId, listItemEl);
          } else if (isGroup) {
            closeMenus(menuId, itemId);
            scheduleOpen(menuId, itemId, listItemEl);
          } else if (!(menuState.current[openMenuId] === 'pending-close' && sameLevel)) {
            closeMenus(menuId, itemId);
          }
        }

        if (state === 'pending-close') {
          if (menuOpenPendingTimeout.current) {
            clearTimeout(menuOpenPendingTimeout.current);
            menuOpenPendingTimeout.current = null;
          }
          clearTimeout(menuClosePendingTimeout.current);
          menuClosePendingTimeout.current = null;
          menuState.current[menuId] = 'popup-open';
        }

        onMouseEnterItem(evt, itemId);
      },

      onClick: (evt) => {
        const listItemEl = closestListItem(evt.target);
        const idx = listItemIndex(listItemEl);
        if (closedNode(listItemEl).ariaHasPopup === 'true') {
          if (listItemEl.ariaExpanded !== 'true') {
            openMenu(idx);
          } else {
            // do nothing
          }
        } else {
          onActivate(getItemId(listItemEl.id));
        }
      }
    }),
    [closeMenus, onActivate, onMouseEnterItem, openMenu, scheduleClose, scheduleOpen]
  );

  return {
    closeMenu,
    handleRender,
    listItemProps,
    openMenu,
    openMenus: openMenus.current
  };
};
