import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import cx from "classnames";
import { HTMLAttributes, MouseEvent, useCallback, useRef } from "react";
import { ColumnResizer } from "./ColumnResizer";
import { SortIndicator } from "./SortIndicator";
import { useTableColumnResize } from "./useTableColumnResize";
import { TableColumnResizeHandler } from "./dataTableTypes";

import "./TableHeaderCell.css";
import { useContextMenu } from "@finos/vuu-popups";

const classBase = "vuuTable-headerCell";

export interface TableHeaderCellProps
  extends HTMLAttributes<HTMLTableCellElement> {
  column: KeyedColumnDescriptor;
  debugString?: string;
  onDragStart?: (evt: MouseEvent) => void;
  onDragEnd?: () => void;
  onResize?: TableColumnResizeHandler;
}

export const TableHeaderCell = ({
  column,
  className: classNameProp,
  onClick,
  onDragEnd,
  onDragStart,
  onResize,
  ...props
}: TableHeaderCellProps) => {
  const rootRef = useRef<HTMLTableCellElement>(null);
  const { isResizing, ...resizeProps } = useTableColumnResize({
    column,
    onResize,
    rootRef,
  });

  const showContextMenu = useContextMenu();

  const handleContextMenu = (e: MouseEvent<HTMLElement>) => {
    showContextMenu(e, "header", { column });
  };

  const handleClick = useCallback(
    (evt: MouseEvent<HTMLTableCellElement>) => !isResizing && onClick?.(evt),
    [isResizing, onClick]
  );

  const handleMouseDown = useCallback(
    (evt: MouseEvent) => {
      onDragStart?.(evt);
    },
    [onDragStart]
  );
  const handleMouseUp = useCallback(() => {
    onDragEnd?.();
  }, [onDragEnd]);

  const className = cx(classBase, classNameProp, {
    vuuPinLeft: column.pin === "left",
    [`${classBase}-resizing`]: column.resizing,
    [`${classBase}-right`]: column.align === "right",
  });
  return (
    <th
      className={className}
      {...props}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      ref={rootRef}
    >
      <div className={`${classBase}-inner`}>
        <div className={`${classBase}-label`}>{column.label}</div>
        <SortIndicator sorted={column.sorted} />
        {column.resizeable !== false ? (
          <ColumnResizer {...resizeProps} />
        ) : null}
      </div>
    </th>
  );
};
