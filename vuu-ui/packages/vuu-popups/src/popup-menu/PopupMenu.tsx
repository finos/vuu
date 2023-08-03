import {
  HTMLAttributes,
  MouseEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import {
  PopupCloseReason,
  reasonIsClickAway,
  useContextMenu,
} from "@finos/vuu-popups";
import cx from "classnames";
import { Button } from "@salt-ds/core";
import { useId } from "@finos/vuu-layout";

import "./PopupMenu.css";
import { MenuActionHandler, MenuBuilder } from "@finos/vuu-data-types";

const classBase = "vuuPopupMenu";

export interface PopupMenuProps extends HTMLAttributes<HTMLButtonElement> {
  icon?: string;
  menuActionHandler?: MenuActionHandler;
  menuBuilder?: MenuBuilder;
  menuLocation?: string;
  menuOptions?: { [key: string]: unknown };
  onMenuClose?: () => void;
}

const getPosition = (element: HTMLElement | null) => {
  if (element) {
    const { bottom, left } = element.getBoundingClientRect();
    return { x: left, y: bottom + 6 };
  }
};

export const PopupMenu = ({
  className,
  icon = "more-vert",
  id: idProp,
  menuActionHandler,
  menuBuilder,
  menuLocation = "header",
  menuOptions,
  onMenuClose,
  tabIndex = 0,
  ...htmlAttributes
}: PopupMenuProps) => {
  const rootRef = useRef<HTMLButtonElement>(null);
  const suppressShowMenuRef = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const id = useId(idProp);
  const [showContextMenu] = useContextMenu(menuBuilder, menuActionHandler);

  const handleMenuClose = useCallback(
    (reason?: PopupCloseReason) => {
      console.log(`PopupMenu popup closed`, {
        reason,
      });
      setMenuOpen(false);
      // If user has clicked the MenuButton whilst menu is open, we want to close it.
      // The PopupService will close it for us as a 'click-away' event. We don't want
      // that click on the button to re-open it.
      if (reasonIsClickAway(reason)) {
        const target = reason.mouseEvt.target as HTMLElement;
        if (target === rootRef.current) {
          suppressShowMenuRef.current = true;
        }
      } else {
        requestAnimationFrame(() => {
          onMenuClose?.();
          if (tabIndex !== -1) {
            rootRef.current?.focus();
          }
        });
      }
    },
    [onMenuClose, tabIndex]
  );

  const showMenu = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      if (suppressShowMenuRef.current) {
        suppressShowMenuRef.current = false;
      } else {
        setMenuOpen(true);
        showContextMenu(e, menuLocation, {
          ContextMenuProps: {
            id: `${id}-menu`,
            onClose: handleMenuClose,
            position: getPosition(rootRef.current),
          },
          ...menuOptions,
        });
      }
    },
    [handleMenuClose, id, menuLocation, menuOptions, showContextMenu]
  );

  return (
    <Button
      {...htmlAttributes}
      aria-controls={`${id}-menu-root`}
      aria-expanded={menuOpen}
      aria-haspopup="menu"
      className={cx(classBase, className, {
        [`${classBase}-open`]: menuOpen,
      })}
      data-icon={icon}
      id={id}
      onClick={showMenu}
      ref={rootRef}
      tabIndex={tabIndex}
      variant="secondary"
    />
  );
};
