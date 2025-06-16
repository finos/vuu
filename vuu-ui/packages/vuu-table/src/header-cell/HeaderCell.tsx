import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { useContextMenu } from "@vuu-ui/vuu-context-menu";
import { ColumnMenu } from "@vuu-ui/vuu-table-extras";
import { HeaderCellProps } from "@vuu-ui/vuu-table-types";
import cx from "clsx";
import {
  KeyboardEventHandler,
  MouseEvent,
  MouseEventHandler,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { SortIndicator } from "../column-header-pill";
import { ColumnResizer, useTableColumnResize } from "../column-resizing";
import { useCell } from "../useCell";

import headerCellCss from "./HeaderCell.css";

const classBase = "vuuTableHeaderCell";

export const HeaderCell = ({
  className: classNameProp,
  column,
  onClick,
  onResize,
  showMenu = true,
  ...htmlAttributes
}: HeaderCellProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-header-cell",
    css: headerCellCss,
    window: targetWindow,
  });

  const { HeaderCellContentRenderer, HeaderCellLabelRenderer } = column;
  const rootRef = useRef<HTMLDivElement>(null);
  const { isResizing, ...resizeProps } = useTableColumnResize({
    column,
    onResize,
    rootRef,
  });

  const showContextMenu = useContextMenu();

  const handleContextMenu = useMemo(() => {
    if (showMenu) {
      return undefined;
    } else {
      return (e: MouseEvent) => showContextMenu(e, "column-menu", { column });
    }
  }, [column, showContextMenu, showMenu]);

  const headerItems = useMemo(() => {
    const sortIndicator = <SortIndicator column={column} />;
    const columnLabel = HeaderCellLabelRenderer ? (
      <HeaderCellLabelRenderer
        className={`${classBase}-label`}
        column={column}
      />
    ) : (
      <div className={`${classBase}-label`}>{column.label ?? column.name}</div>
    );
    const columnContent = HeaderCellContentRenderer
      ? [<HeaderCellContentRenderer column={column} key="content" />]
      : [];

    if (showMenu) {
      const columnMenu = <ColumnMenu column={column} />;

      if (column.align === "right") {
        return [sortIndicator, columnLabel, columnContent, columnMenu];
      } else {
        return [columnMenu, columnLabel, sortIndicator, columnContent];
      }
    } else {
      if (column.align === "right") {
        return [sortIndicator, columnLabel, columnContent];
      } else {
        return [columnLabel, sortIndicator, columnContent];
      }
    }
  }, [HeaderCellContentRenderer, HeaderCellLabelRenderer, column, showMenu]);

  const handleClick = useCallback<MouseEventHandler<HTMLDivElement>>(
    (evt) => {
      !isResizing && onClick?.(evt);
    },
    [isResizing, onClick],
  );

  const handleKeyDown = useCallback<KeyboardEventHandler<HTMLDivElement>>(
    (evt) => {
      if (evt.key === "Enter") {
        onClick?.(evt);
      }
    },
    [onClick],
  );

  const { className, style } = useCell(column, classBase, true);

  return (
    <div
      {...htmlAttributes}
      aria-colindex={column.ariaColIndex}
      className={cx(className, classNameProp, {
        [`${classBase}-resizing`]: isResizing,
        [`${classBase}-noMenu`]: showMenu === false,
      })}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      ref={rootRef}
      role="columnheader"
      style={style}
    >
      {...headerItems}
      {column.resizeable !== false ? <ColumnResizer {...resizeProps} /> : null}
    </div>
  );
};
