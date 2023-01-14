import {
  MouseEvent,
  SyntheticEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import { closestListItem, listItemIndex } from "./list-dom-utils";
import { MenuItemProps } from "./MenuList";
// import {mousePosition} from './aim/utils';
// import {aiming} from './aim/aim';

const nudge = (
  menus: RuntimeMenuDescriptor[],
  distance: number,
  pos: "left" | "top"
) => {
  return menus.map((m, i) =>
    i === menus.length - 1
      ? {
          ...m,
          [pos]: m[pos] - distance,
        }
      : m
  );
};
const nudgeLeft = (menus: RuntimeMenuDescriptor[], distance: number) =>
  nudge(menus, distance, "left");
const nudgeUp = (menus: RuntimeMenuDescriptor[], distance: number) =>
  nudge(menus, distance, "top");

const flipSides = (id: string, menus: RuntimeMenuDescriptor[]) => {
  const [parentMenu, menu] = menus.slice(-2);
  const el = document.getElementById(`${id}-${menu.id}`);
  if (el === null) {
    throw Error(`useCascade.flipSides element with id ${menu.id} not found`);
  }
  const { width } = el.getBoundingClientRect();
  return menus.map((m) =>
    m === menu
      ? {
          ...m,
          left: parentMenu.left - (width - 2),
        }
      : m
  );
};

// const closedNode = (el: HTMLElement) =>
//   el.ariaHasPopup === "true" && el.ariaExpanded !== "true";
const getPosition = (el: HTMLElement, openMenus: RuntimeMenuDescriptor[]) => {
  const [{ left, top: menuTop }] = openMenus.slice(-1);
  // const {top, right, bottom, left} = el.getBoundingClientRect();
  // this will not work for MenuList within window, we need the
  // const {offsetLeft: left, offsetTop: menuTop} = el.closest('.vuuMenuList');
  const { offsetWidth: width, offsetTop: top } = el;
  return { left: left + width, top: top + menuTop };
};

export type RuntimeMenuDescriptor = {
  id: string;
  left: number;
  top: number;
};

export const getItemId = (id: string) => {
  const pos = id.lastIndexOf("-");
  return pos === -1 ? id : id.slice(pos + 1);
};

export const getMenuId = (id: string) => {
  const itemId = getItemId(id);
  const pos = itemId.lastIndexOf(".");
  return pos > -1 ? itemId.slice(0, pos) : "root";
};

const getMenuDepth = (id: string) => {
  let count = 0,
    pos = id.indexOf(".", 0);
  while (pos !== -1) {
    count += 1;
    pos = id.indexOf(".", pos + 1);
  }
  return count;
};

const identifyItem = (el: HTMLElement) => ({
  menuId: getMenuId(el.id),
  itemId: getItemId(el.id),
  isGroup: el.ariaHasPopup === "true",
  isOpen: el.ariaExpanded === "true",
  level: getMenuDepth(el.id),
});

export interface CascadeHookProps {
  id: string;
  onActivate: (menuId: string) => void;
  onMouseEnterItem: (evt: MouseEvent, itemId: string) => void;
  position: { x: number; y: number };
}

export interface CascadeHooksResult {
  closeMenu: () => void;
  handleRender: () => void;
  listItemProps: Partial<MenuItemProps>;
  openMenu: (menuId?: string, itemId?: string) => void;
  openMenus: RuntimeMenuDescriptor[];
}

type MenuStatus = "no-popup" | "popup-open" | "pending-close" | "popup-pending";
type MenuState = { [key: string]: MenuStatus };

export const useCascade = ({
  id,
  onActivate,
  onMouseEnterItem,
  position: { x: posX, y: posY },
}: CascadeHookProps): CascadeHooksResult => {
  const [, forceRefresh] = useState({});
  const openMenus = useRef<RuntimeMenuDescriptor[]>([
    { id: "root", left: posX, top: posY },
  ]);

  const setOpenMenus = useCallback((menus: RuntimeMenuDescriptor[]) => {
    openMenus.current = menus;
    forceRefresh({});
  }, []);

  const menuOpenPendingTimeout = useRef<number | undefined>();
  const menuClosePendingTimeout = useRef<number | undefined>();
  const menuState = useRef<MenuState>({ root: "no-popup" });
  const prevLevel = useRef(0);

  // const prevAim = useRef({mousePos: null, distance: true});

  const openMenu = useCallback(
    (menuId = "root", itemId = null, listItemEl = null) => {
      if (menuId === "root" && itemId === null) {
        setOpenMenus([{ id: "root", left: posX, top: posY }]);
      } else {
        menuState.current[menuId] = "popup-open";
        const doc = listItemEl ? listItemEl.ownerDocument : document;
        const el = doc.getElementById(`${id}-${menuId}-${itemId}`);
        const { left, top } = getPosition(el, openMenus.current);
        setOpenMenus(openMenus.current.concat({ id: itemId, left, top }));
      }
    },
    [id, posX, posY, setOpenMenus]
  );

  const closeMenu = useCallback(
    (menuId?: string) => {
      if (menuId === "root") {
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
        menuState.current[lastMenuId] = "no-popup";
        menuState.current[parentMenuId] = "no-popup";
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
      menuOpenPendingTimeout.current = window.setTimeout(() => {
        console.log(`scheduleOpen timed out opening ${itemId}`);
        closeMenus(menuId, itemId);
        menuState.current[menuId] = "popup-open";
        menuState.current[itemId] = "no-popup";
        openMenu(menuId, itemId, listItemEl);
      }, 400);
    },
    [closeMenus, openMenu]
  );

  const scheduleClose = useCallback(
    (openMenuId, menuId, itemId) => {
      console.log(
        `scheduleClose openMenuId ${openMenuId} menuId ${menuId} itemId ${itemId}`
      );
      menuState.current[openMenuId] = "pending-close";
      menuClosePendingTimeout.current = window.setTimeout(() => {
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
          menus.length > 1
            ? flipSides(id, menus)
            : nudgeLeft(menus, right - clientWidth);
        setOpenMenus(newMenus);
      } else if (bottom > clientHeight) {
        const newMenus = nudgeUp(menus, bottom - clientHeight);
        setOpenMenus(newMenus);
      }
    }
  }, [id, setOpenMenus]);

  const listItemProps: Partial<MenuItemProps> = useMemo(
    () => ({
      onMouseEnter: (evt: MouseEvent) => {
        const listItemEl = closestListItem(evt.target as HTMLElement);
        const { menuId, itemId, isGroup, isOpen, level } =
          identifyItem(listItemEl);
        const sameLevel = prevLevel.current === level;
        const {
          current: { [menuId]: state },
        } = menuState;
        prevLevel.current = level;

        // console.log(
        //   `%conMouseEnter #${menuId}[${itemId}] @${level}
        //     isGroup ${isGroup} isOpen ${isOpen}
        //     openMenus [${openMenus.current.join(',')}]
        //     state='${JSON.stringify(menuState.current)}`,
        //     'color: green; font-weight: bold;'
        // );

        if (state === "no-popup" && isGroup) {
          // Shouldn;t we always set this ?
          menuState.current[menuId] = "popup-pending";
          scheduleOpen(menuId, itemId, listItemEl);
        } else if (state === "popup-pending" && !isGroup) {
          menuState.current[menuId] = "no-popup";
          clearTimeout(menuOpenPendingTimeout.current);
          menuOpenPendingTimeout.current = undefined;
        } else if (state === "popup-pending" && isGroup) {
          clearTimeout(menuOpenPendingTimeout.current);
          scheduleOpen(menuId, itemId, listItemEl);
        } else if (state === "popup-open") {
          const [{ id: parentMenuId }, { id: openMenuId }] =
            openMenus.current.slice(-2);
          if (
            parentMenuId === menuId &&
            menuState.current[openMenuId] !== "pending-close" &&
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
            menuState.current[openMenuId] === "pending-close"
          ) {
            // if there is already an item queued for opening cancel it
            scheduleOpen(menuId, itemId, listItemEl);
          } else if (isGroup) {
            closeMenus(menuId, itemId);
            scheduleOpen(menuId, itemId, listItemEl);
          } else if (
            !(menuState.current[openMenuId] === "pending-close" && sameLevel)
          ) {
            closeMenus(menuId, itemId);
          }
        }

        if (state === "pending-close") {
          if (menuOpenPendingTimeout.current) {
            clearTimeout(menuOpenPendingTimeout.current);
            menuOpenPendingTimeout.current = undefined;
          }
          clearTimeout(menuClosePendingTimeout.current);
          menuClosePendingTimeout.current = undefined;
          menuState.current[menuId] = "popup-open";
        }

        onMouseEnterItem(evt, itemId);
      },

      onClick: (evt: SyntheticEvent) => {
        const targetElement = evt.target as HTMLElement;
        const listItemEl = closestListItem(targetElement);
        const idx = listItemIndex(listItemEl);
        console.log(
          `list item click [${idx}] hasPopup ${listItemEl.ariaHasPopup}`
        );
        if (listItemEl.ariaHasPopup === "true") {
          if (listItemEl.ariaExpanded !== "true") {
            openMenu(idx);
          } else {
            // do nothing
          }
        } else {
          onActivate(getItemId(listItemEl.id));
        }
      },
    }),
    [
      closeMenus,
      onActivate,

      onMouseEnterItem,
      openMenu,
      scheduleClose,
      scheduleOpen,
    ]
  );

  return {
    closeMenu,
    handleRender,
    listItemProps,
    openMenu,
    openMenus: openMenus.current,
  };
};
