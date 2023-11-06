import {
  MouseEvent,
  SyntheticEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import { closestListItem } from "./list-dom-utils";
import { MenuItemProps, MenuOpenHandler } from "./MenuList";
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

/**  menuitem-vuu-1-0   vuu-1 */
export const getHostMenuId = (id: string, rootId: string) => {
  const pos = id.lastIndexOf("-");
  if (id.startsWith("menuitem")) {
    return pos > -1 ? id.slice(9, pos) : rootId;
  } else {
    return pos > -1 ? id.slice(0, pos) : rootId;
  }
};

const getTargetMenuId = (id: string) => id.slice(9);

const getMenuItemDetails = (
  { ariaExpanded, ariaHasPopup, id }: HTMLElement,
  rootId: string
) => {
  if (id.startsWith("menuitem")) {
    return {
      hostMenuId: getHostMenuId(id, rootId),
      targetMenuId: getTargetMenuId(id),
      menuItemId: id,
      isGroup: ariaHasPopup === "true",
      isOpen: ariaExpanded === "true",
    };
  } else {
    throw Error(`getMenuItemDetails #${id} is not a menuitem`);
  }
};

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
  openMenu: MenuOpenHandler;
  openMenus: RuntimeMenuDescriptor[];
}

type MenuStatus = "no-popup" | "popup-open" | "pending-close" | "popup-pending";
type MenuState = { [key: string]: MenuStatus };

export const useCascade = ({
  id: rootId,
  onActivate,
  onMouseEnterItem,
  position: { x: posX, y: posY },
}: CascadeHookProps): CascadeHooksResult => {
  const [, forceRefresh] = useState({});
  const openMenus = useRef<RuntimeMenuDescriptor[]>([
    { id: rootId, left: posX, top: posY },
  ]);

  const menuIsOpen = useCallback(
    (menuId: string) =>
      openMenus.current.findIndex((menu) => menu.id === menuId) !== -1,
    []
  );

  const getOpenMenuStatus = useCallback((menuId: string) => {
    const state = menuState.current[menuId];
    if (state === undefined) {
      throw Error(`getOpenMenuState no entry for menu ${menuId}`);
    }
    return state;
  }, []);

  const setOpenMenus = useCallback((menus: RuntimeMenuDescriptor[]) => {
    openMenus.current = menus;
    forceRefresh({});
  }, []);

  const menuOpenPendingTimeout = useRef<number | undefined>();
  const menuClosePendingTimeout = useRef<number | undefined>();
  const menuState = useRef<MenuState>({ [rootId]: "no-popup" });
  // const prevLevel = useRef(0);

  // const prevAim = useRef({mousePos: null, distance: true});

  const openMenu = useCallback(
    (hostMenuId = rootId, targetMenuId: string, itemId = null) => {
      if (hostMenuId === rootId && itemId === null) {
        setOpenMenus([{ id: rootId, left: posX, top: posY }]);
      } else {
        menuState.current[hostMenuId] = "popup-open";
        const el = document.getElementById(itemId) as HTMLElement;
        if (el !== null) {
          const { left, top } = getPosition(el, openMenus.current);
          setOpenMenus(
            openMenus.current.concat({ id: targetMenuId, left, top })
          );
        } else {
          throw Error(`openMenu no menuItem ${itemId}`);
        }
      }
    },
    [rootId, posX, posY, setOpenMenus]
  );

  const closeMenu = useCallback(
    (menuId?: string) => {
      if (menuId === rootId) {
        setOpenMenus([]);
      } else {
        const menus = openMenus.current.slice();
        const lastMenu = menus.pop() as RuntimeMenuDescriptor;
        menuState.current[lastMenu.id] = "no-popup";
        const parentMenu = menus.at(-1);
        if (parentMenu) {
          menuState.current[parentMenu.id] = "no-popup";
        }
        setOpenMenus(menus);
      }
    },
    [rootId, setOpenMenus]
  );

  const closeMenus = useCallback(
    (menuItemId) => {
      const menus = openMenus.current.slice();
      const menuItemMenuId = menuItemId.slice(9);
      let { id: lastMenuId } = menus.at(-1) as RuntimeMenuDescriptor;
      while (menus.length > 1 && !menuItemMenuId.startsWith(lastMenuId)) {
        const parentMenuId = getHostMenuId(lastMenuId, rootId);
        menus.pop();
        menuState.current[lastMenuId] = "no-popup";
        menuState.current[parentMenuId] = "no-popup";
        ({ id: lastMenuId } = menus[menus.length - 1]);
      }
      if (menus.length < openMenus.current.length) {
        setOpenMenus(menus);
      }
    },
    [rootId, setOpenMenus]
  );

  const clearAnyScheduledOpenTasks = useCallback(() => {
    if (menuOpenPendingTimeout.current) {
      clearTimeout(menuOpenPendingTimeout.current);
      menuOpenPendingTimeout.current = undefined;
    }
  }, []);

  const scheduleOpen = useCallback(
    (
      hostMenuId: string,
      targetMenuId: string,
      menuItemId: string,
      delay = 300
    ) => {
      clearAnyScheduledOpenTasks();
      // do we need to set target state to pending-open ?s

      menuOpenPendingTimeout.current = window.setTimeout(() => {
        // console.log(
        //   `scheduleOpen<timeout> opening menu ${targetMenuId} from menu ${hostMenuId} via menuitem ${menuItemId}`
        // );
        closeMenus(menuItemId);
        menuState.current[hostMenuId] = "popup-open";
        menuState.current[targetMenuId] = "no-popup";
        openMenu(hostMenuId, targetMenuId, menuItemId);
      }, delay);
    },
    [clearAnyScheduledOpenTasks, closeMenus, openMenu]
  );

  const scheduleClose = useCallback(
    (hostMenuId: string, openMenuId: string, itemId: string) => {
      // console.log(
      //   `scheduleClose openMenuId ${openMenuId} from parent menu ${hostMenuId} itemId ${itemId}`
      // );
      menuState.current[openMenuId] = "pending-close";
      menuClosePendingTimeout.current = window.setTimeout(() => {
        // console.log(`call closeMenus from scheduleClose`);
        closeMenus(itemId);
      }, 400);
    },
    [closeMenus]
  );

  const handleRender = useCallback(() => {
    const { current: menus } = openMenus;
    const menu = menus.at(-1);
    const el = menu ? document.getElementById(menu.id) : undefined;
    if (el) {
      const { right, bottom } = el.getBoundingClientRect();
      const { clientHeight, clientWidth } = document.body;
      if (right > clientWidth) {
        const newMenus =
          menus.length > 1
            ? flipSides(rootId, menus)
            : nudgeLeft(menus, right - clientWidth);
        setOpenMenus(newMenus);
      } else if (bottom > clientHeight) {
        const newMenus = nudgeUp(menus, bottom - clientHeight);
        setOpenMenus(newMenus);
      }

      if (typeof el.tabIndex === "number") {
        el.focus();
      }
    }
  }, [rootId, setOpenMenus]);

  // TODO introduce a delay parameter that allows click to requeat an immediate render
  const triggerChildMenu = useCallback<MenuOpenHandler>(
    (menuItemEl, immediate = false) => {
      const { hostMenuId, targetMenuId, menuItemId, isGroup, isOpen } =
        getMenuItemDetails(menuItemEl, rootId);
      const {
        current: { [hostMenuId]: state },
      } = menuState;

      const delay = immediate ? 0 : undefined;

      // console.log(
      //   `%ctriggerChildMenu
      //   rootId ${rootId}
      //   menuItem ${menuItemId}
      //   host menu: ${hostMenuId}
      //   target menu: ${targetMenuId}
      //   item index: ${menuItemId}
      //   state ${state}
      //   isGroup ${isGroup} isOpen ${isOpen}
      //   openMenus: ${JSON.stringify(openMenus.current)}
      //   full state='${JSON.stringify(menuState.current)}`,
      //   "color: green; font-weight: bold;"
      // );

      if (state === "no-popup" && isGroup) {
        menuState.current[hostMenuId] = "popup-pending";
        scheduleOpen(hostMenuId, targetMenuId, menuItemId, delay);
      } else if (state === "popup-pending" && !isGroup) {
        menuState.current[hostMenuId] = "no-popup";
        clearTimeout(menuOpenPendingTimeout.current);
        menuOpenPendingTimeout.current = undefined;
      } else if (state === "popup-pending" && isGroup) {
        clearTimeout(menuOpenPendingTimeout.current);
        scheduleOpen(hostMenuId, targetMenuId, menuItemId, delay);
      } else if (state === "popup-open") {
        if (menuIsOpen(targetMenuId)) {
          const menuStatus = getOpenMenuStatus(targetMenuId);
          // Close any child menus of the target menu. This can happen if we have
          // opened child menus, then moused out of the menu entirely, to re-enter
          // at a higher level
          closeMenus(menuItemId);

          switch (menuStatus) {
            case "pending-close":
              // cancel the close
              clearTimeout(menuClosePendingTimeout.current);
              menuClosePendingTimeout.current = undefined;
              menuState.current[targetMenuId] = "no-popup";
              clearAnyScheduledOpenTasks();
              break;
            default:
          }
        } else {
          // TODO review the below, suspectb it's over complicating things
          const [parentOfLastOpenedMenu, lastOpenedMenu] =
            openMenus.current.slice(-2);
          if (
            parentOfLastOpenedMenu.id === hostMenuId &&
            menuState.current[lastOpenedMenu.id] !== "pending-close" /*&&
          sameLevel*/
          ) {
            scheduleClose(hostMenuId, lastOpenedMenu.id, menuItemId);
            if (isGroup && !isOpen) {
              scheduleOpen(hostMenuId, targetMenuId, menuItemId, delay);
            }
          } else if (
            parentOfLastOpenedMenu.id === hostMenuId &&
            isGroup &&
            menuItemId !== lastOpenedMenu.id &&
            menuState.current[lastOpenedMenu.id] === "pending-close"
          ) {
            // if there is already an item queued for opening cancel it
            scheduleOpen(hostMenuId, targetMenuId, menuItemId, delay);
          } else if (isGroup) {
            // closeMenus(menuId, itemId);
            scheduleOpen(hostMenuId, targetMenuId, menuItemId, delay);
          } else if (
            !(
              (menuState.current[lastOpenedMenu.id] === "pending-close") /*&&
            sameLevel*/
            )
          ) {
            closeMenus(menuItemId);
          }
        }
      }

      if (state === "pending-close") {
        clearAnyScheduledOpenTasks();
        clearTimeout(menuClosePendingTimeout.current);
        menuClosePendingTimeout.current = undefined;
        menuState.current[hostMenuId] = "popup-open";
      }
    },
    [
      clearAnyScheduledOpenTasks,
      closeMenus,
      getOpenMenuStatus,
      menuIsOpen,
      rootId,
      scheduleClose,
      scheduleOpen,
    ]
  );

  const listItemProps: Partial<MenuItemProps> = useMemo(
    () => ({
      onMouseEnter: (evt: MouseEvent) => {
        const menuItemEl = closestListItem(evt.target as HTMLElement);
        triggerChildMenu(menuItemEl);
        onMouseEnterItem(evt, menuItemEl.id);
      },

      onClick: (evt: SyntheticEvent) => {
        const listItemEl = closestListItem(evt.target as HTMLElement);
        const { isGroup, menuItemId } = getMenuItemDetails(listItemEl, rootId);
        if (isGroup) {
          triggerChildMenu(listItemEl);
        } else {
          onActivate(menuItemId);
        }
      },
    }),
    [onActivate, onMouseEnterItem, rootId, triggerChildMenu]
  );

  return {
    closeMenu,
    handleRender,
    listItemProps,
    openMenu: triggerChildMenu,
    openMenus: openMenus.current,
  };
};
