import {
  HTMLAttributes,
  MouseEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import { useContextMenu } from "@finos/vuu-popups";

import cx from "classnames";

import "./ColumnMenu.css";
import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { useThemeAttributes } from "@finos/vuu-shell";

export interface ColumnMenuProps extends HTMLAttributes<HTMLSpanElement> {
  column: KeyedColumnDescriptor;
}

const getPosition = (element?: HTMLElement) => {
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
  const rootRef = useRef<HTMLSpanElement | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const showContextMenu = useContextMenu();
  const [themeClass, densityClass, dataMode] = useThemeAttributes();

  const handleMenuClose = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const showColumnMenu = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      setMenuOpen(true);
      showContextMenu(e, "header", {
        column,
        ContextMenuProps: {
          className: cx(themeClass, densityClass),
          "data-mode": dataMode,
          onClose: handleMenuClose,
          position: getPosition(rootRef.current),
        },
      });
    },
    [
      column,
      dataMode,
      densityClass,
      handleMenuClose,
      showContextMenu,
      themeClass,
    ]
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
