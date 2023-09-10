import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { HTMLAttributes, MouseEvent, useCallback, useRef } from "react";
import { useCell } from "../useCell";
import { ColumnMenu } from "../column-menu";
import { SortIndicator } from "../column-header-pill";
import cx from "classnames";
import {
  ColumnResizer,
  TableColumnResizeHandler,
  useTableColumnResize,
} from "../column-resizing";

import "./HeaderCell.css";

const classBase = "vuuTableNextHeaderCell";

export interface HeaderCellProps extends HTMLAttributes<HTMLDivElement> {
  classBase?: string;
  column: KeyedColumnDescriptor;
  onResize?: TableColumnResizeHandler;
}

export const HeaderCell = ({
  className: classNameProp,
  column,
  onClick,
  onResize,
  ...htmlAttributes
}: HeaderCellProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const { isResizing, ...resizeProps } = useTableColumnResize({
    column,
    onResize,
    rootRef,
  });

  const handleClick = useCallback(
    (evt: MouseEvent<HTMLTableCellElement>) => {
      console.log(`click isResizing ${isResizing}`);
      !isResizing && onClick?.(evt);
    },
    [isResizing, onClick]
  );

  const { className, style } = useCell(column, classBase, true);

  const columnMenu = <ColumnMenu column={column} />;
  const columnLabel = (
    <div className={`${classBase}-label`}>{column.label ?? column.name}</div>
  );
  const sortIndicator = <SortIndicator column={column} />;
  const headerItems =
    column.align === "right"
      ? [sortIndicator, columnLabel, columnMenu]
      : [columnMenu, columnLabel, sortIndicator];

  return (
    <div
      {...htmlAttributes}
      className={cx(className, classNameProp, {
        [`${classBase}-resizing`]: isResizing,
      })}
      onClick={handleClick}
      ref={rootRef}
      role="columnheader"
      style={style}
    >
      {...headerItems}
      {column.resizeable !== false ? <ColumnResizer {...resizeProps} /> : null}
    </div>
  );
};
