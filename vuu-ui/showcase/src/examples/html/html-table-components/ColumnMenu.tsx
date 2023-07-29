import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { useContextMenu } from "@finos/vuu-popups";
import cx from "classnames";
import {
  HTMLAttributes,
  MouseEvent,
  useCallback,
  useRef,
  useState,
} from "react";

import "./ColumnMenu.css";

export interface ColumnMenuProps extends HTMLAttributes<HTMLSpanElement> {
  column: KeyedColumnDescriptor;
}

const getPosition = (element: HTMLElement | null) => {
  if (element) {
    const { bottom, left } = element.getBoundingClientRect();
    return { x: left, y: bottom + 6 };
  }
};

export const ColumnMenu = ({
  className,
  column,
  ...props
}: ColumnMenuProps) => {
  const rootRef = useRef<HTMLSpanElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showContextMenu] = useContextMenu();

  const handleMenuClose = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const showColumnMenu = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      setMenuOpen(true);
      showContextMenu(e, "column-menu", {
        column,
        ContextMenuProps: {
          onClose: handleMenuClose,
          position: getPosition(rootRef.current),
        },
      });
    },
    [column, handleMenuClose, showContextMenu]
  );

  return (
    <span
      {...props}
      className={cx("vuuTable-columnMenu", className, {
        "vuuTable-columnMenu-open": menuOpen,
      })}
      data-icon="more-vert"
      onClick={showColumnMenu}
      ref={rootRef}
    />
  );
};
