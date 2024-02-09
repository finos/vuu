import { MenuActionHandler, MenuBuilder } from "@finos/vuu-data-types";
import { useId } from "@finos/vuu-utils";
import { Button } from "@salt-ds/core";
import cx from "clsx";
import {
  HTMLAttributes,
  MouseEvent,
  RefObject,
  useCallback,
  useRef,
  useState,
} from "react";
import { MenuOpenHandler, useContextMenu } from "../menu";
import { getPositionRelativeToAnchor } from "../popup/getPositionRelativeToAnchor";
import { PopupPlacement } from "../popup/Popup";
import {
  PopupCloseCallback,
  PopupCloseReason,
  reasonIsClickAway,
} from "../popup/popup-service";

import "./PopupMenu.css";

const classBase = "vuuPopupMenu";

export type MenuCloseHandler = (reason?: PopupCloseReason) => void;

export interface PopupMenuProps extends HTMLAttributes<HTMLButtonElement> {
  anchorElement?: RefObject<HTMLElement>;
  icon?: string;
  label?: string;
  menuActionHandler?: MenuActionHandler;
  menuBuilder?: MenuBuilder;
  menuClassName?: string;
  menuLocation?: string;
  menuOptions?: { [key: string]: unknown };
  onMenuClose?: MenuCloseHandler;
  onMenuOpen?: () => void;
  popupPlacement?: PopupPlacement;
}

export const PopupMenu = ({
  anchorElement,
  className,
  label,
  icon = label ? "chevron-down" : "more-vert",
  id: idProp,
  menuActionHandler,
  menuBuilder,
  menuClassName,
  menuLocation = "header",
  menuOptions,
  onMenuClose,
  onMenuOpen,
  popupPlacement = "below-right",
  tabIndex = 0,
  ...htmlAttributes
}: PopupMenuProps) => {
  const rootRef = useRef<HTMLButtonElement>(null);
  const suppressShowMenuRef = useRef(false);
  const [menuOpen, _setMenuOpen] = useState(false);
  const id = useId(idProp);
  const [showContextMenu] = useContextMenu(menuBuilder, menuActionHandler);

  const setMenuOpen = useCallback(
    (isOpen) => {
      _setMenuOpen(isOpen);
      if (isOpen) {
        onMenuOpen?.();
      }
    },
    [onMenuOpen]
  );

  const handleOpenMenu = useCallback<MenuOpenHandler>((el) => {
    console.log(`menu Open `, {
      el,
    });
  }, []);

  const handleMenuClose = useCallback<PopupCloseCallback>(
    (reason?: PopupCloseReason) => {
      console.log("onClose");
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
    [onMenuClose, setMenuOpen, tabIndex]
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
    ]
  );

  return (
    <Button
      {...htmlAttributes}
      aria-controls={menuOpen ? `${id}-menu` : undefined}
      aria-expanded={menuOpen}
      aria-haspopup="menu"
      className={cx(classBase, className, {
        [`${classBase}-withCaption`]: label !== undefined,
        [`${classBase}-open`]: menuOpen,
      })}
      data-icon={icon}
      id={id}
      onClick={showMenu}
      ref={rootRef}
      tabIndex={tabIndex}
      variant="secondary"
    >
      {label}
    </Button>
  );
};
