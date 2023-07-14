import {
  HTMLAttributes,
  MouseEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import { useContextMenu } from "@finos/vuu-popups";
import cx from "classnames";

import "./PopupMenu.css";
import { MenuActionHandler, MenuBuilder } from "@finos/vuu-data-types";

const classBase = "vuuPopupMenu";

export interface PopupMenuProps extends HTMLAttributes<HTMLSpanElement> {
  icon?: string;
  menuActionHandler?: MenuActionHandler;
  menuBuilder?: MenuBuilder;
  menuLocation?: string;
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
  menuActionHandler,
  menuBuilder,
  menuLocation = "header",
  ...htmlAttributes
}: PopupMenuProps) => {
  const rootRef = useRef<HTMLSpanElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const showContextMenu = useContextMenu(menuBuilder, menuActionHandler);

  const handleMenuClose = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const showColumnMenu = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      setMenuOpen(true);
      showContextMenu(e, menuLocation, {
        ContextMenuProps: {
          onClose: handleMenuClose,
          position: getPosition(rootRef.current),
        },
      });
    },
    [handleMenuClose, menuLocation, showContextMenu]
  );

  return (
    <span
      {...htmlAttributes}
      className={cx(classBase, className, {
        [`${classBase}-open`]: menuOpen,
      })}
      data-icon={icon}
      onClick={showColumnMenu}
      ref={rootRef}
    />
  );
};
