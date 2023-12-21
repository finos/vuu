import { HeaderCellProps } from "@finos/vuu-table-types";
import cx from "clsx";
import { MouseEventHandler, useCallback, useRef } from "react";
import { SortIndicator } from "../column-header-pill";
import { ColumnMenu } from "../column-menu";
import { ColumnResizer, useTableColumnResize } from "../column-resizing";
import { useCell } from "../useCell";

import "./HeaderCell.css";

const classBase = "vuuTableHeaderCell";

export const HeaderCell = ({
  className: classNameProp,
  column,
  onClick,
  onResize,
  ...htmlAttributes
}: HeaderCellProps) => {
  const { HeaderCellContentRenderer, HeaderCellLabelRenderer } = column;
  const rootRef = useRef<HTMLDivElement>(null);
  const { isResizing, ...resizeProps } = useTableColumnResize({
    column,
    onResize,
    rootRef,
  });

  const handleClick = useCallback<MouseEventHandler<HTMLDivElement>>(
    (evt) => {
      !isResizing && onClick?.(evt);
    },
    [isResizing, onClick]
  );

  const { className, style } = useCell(column, classBase, true);

  const columnMenu = <ColumnMenu column={column} />;
  const columnLabel = HeaderCellLabelRenderer ? (
    <HeaderCellLabelRenderer className={`${classBase}-label`} column={column} />
  ) : (
    <div className={`${classBase}-label`}>{column.label ?? column.name}</div>
  );

  const columnContent = HeaderCellContentRenderer
    ? [<HeaderCellContentRenderer column={column} key="content" />]
    : [];

  const sortIndicator = <SortIndicator column={column} />;
  const headerItems =
    column.align === "right"
      ? [sortIndicator, columnLabel].concat(columnContent).concat(columnMenu)
      : [columnMenu, columnLabel, sortIndicator].concat(columnContent);

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
