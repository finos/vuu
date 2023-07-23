import {
  HTMLAttributes,
  MouseEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import { useContextMenu } from "@finos/vuu-popups";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const id = useId(idProp);
  const showContextMenu = useContextMenu(menuBuilder, menuActionHandler);

  const handleMenuClose = useCallback(() => {
    setMenuOpen(false);
    requestAnimationFrame(() => {
      onMenuClose?.();
      if (tabIndex !== -1) {
        rootRef.current?.focus();
      }
    });
  }, [onMenuClose, tabIndex]);

  const showMenu = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      setMenuOpen(true);
      showContextMenu(e, menuLocation, {
        ContextMenuProps: {
          id: `${id}-menu`,
          onClose: handleMenuClose,
          position: getPosition(rootRef.current),
        },
        ...menuOptions,
      });
    },
    [handleMenuClose, id, menuLocation, menuOptions, showContextMenu]
  );

  return (
    <Button
      {...htmlAttributes}
      aria-controls={`${id}-menu-root`}
      aria-haspopup="true"
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
