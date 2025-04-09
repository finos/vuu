import {
  AriaAttributes,
  MouseEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import { MenuOpenHandler } from "../menu";
import { PopupMenuProps } from "./PopupMenu";
import { getPositionRelativeToAnchor } from "../popup/getPositionRelativeToAnchor";
import { useContextMenu } from "../menu";
import { PopupCloseCallback, reasonIsClickAway } from "../popup/popup-service";
import { PopupPlacement } from "../popup/Popup";

export interface PopupMenuHookProps
  extends Pick<
    PopupMenuProps,
    | "anchorElement"
    | "menuActionHandler"
    | "menuBuilder"
    | "menuClassName"
    | "menuOptions"
    | "onMenuClose"
    | "onMenuOpen"
  > {
  id: string;
  menuLocation: string;
  popupPlacement: PopupPlacement;
  tabIndex: number;
}

export const usePopupMenu = ({
  anchorElement,
  id,
  menuActionHandler,
  menuBuilder,
  menuClassName,
  menuLocation,
  menuOptions,
  onMenuClose,
  onMenuOpen,
  popupPlacement,
  tabIndex,
}: PopupMenuHookProps) => {
  const [menuOpen, _setMenuOpen] = useState(false);
  const suppressShowMenuRef = useRef(false);
  const rootRef = useRef<HTMLButtonElement>(null);

  const setMenuOpen = useCallback(
    (isOpen: boolean) => {
      _setMenuOpen(isOpen);
      if (isOpen) {
        onMenuOpen?.();
      }
    },
    [onMenuOpen],
  );

  const [showContextMenu] = useContextMenu(menuBuilder, menuActionHandler);

  const handleOpenMenu = useCallback<MenuOpenHandler>((el) => {
    console.log(`menu Open `, {
      el,
    });
  }, []);

  const handleMenuClose = useCallback<PopupCloseCallback>(
    (reason) => {
      setMenuOpen(false);
      // If user has clicked the MenuButton whilst menu is open, we want to close it.
      // The PopupService will close it for us as a 'click-away' event. We don't want
      // that click on the button to re-open it.
      if (reasonIsClickAway(reason)) {
        const target = reason.mouseEvt.target as HTMLElement;
        if (target === rootRef.current) {
          suppressShowMenuRef.current = true;
        }
        onMenuClose?.(reason);
      } else {
        requestAnimationFrame(() => {
          onMenuClose?.(reason);
          if (tabIndex !== -1 && reason?.type !== "tab-away") {
            rootRef.current?.focus();
          }
        });
      }
    },
    [onMenuClose, setMenuOpen, tabIndex],
  );

  const showMenu = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      if (suppressShowMenuRef.current) {
        suppressShowMenuRef.current = false;
      } else {
        const anchorEl = anchorElement?.current ?? rootRef.current;
        if (anchorEl) {
          const {
            left: x,
            top: y,
            width,
          } = getPositionRelativeToAnchor(anchorEl, popupPlacement, 0, 0);
          setMenuOpen(true);

          showContextMenu(e, menuLocation, {
            ContextMenuProps: {
              className: menuClassName,
              id: `${id}-menu`,
              onClose: handleMenuClose,
              openMenu: handleOpenMenu,
              position: {
                x,
                y,
              },
              style: { width: width ? width - 2 : undefined },
            },
            ...menuOptions,
          });
        }
      }
    },
    [
      anchorElement,
      handleMenuClose,
      handleOpenMenu,
      id,
      menuClassName,
      menuLocation,
      menuOptions,
      popupPlacement,
      setMenuOpen,
      showContextMenu,
    ],
  );

  const ariaAttributes: AriaAttributes = {
    "aria-controls": menuOpen ? `${id}-menu` : undefined,
    "aria-expanded": menuOpen,
    "aria-haspopup": "menu",
  };

  const buttonProps = {
    id,
    onClick: showMenu,
    tabIndex,
  };

  return { ariaAttributes, buttonProps, menuOpen, rootRef };
};
