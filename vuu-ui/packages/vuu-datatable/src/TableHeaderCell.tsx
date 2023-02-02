import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import cx from "classnames";
import { HTMLAttributes, MouseEvent, useCallback, useRef } from "react";
import { ColumnResizer } from "./ColumnResizer";
import { SortIndicator } from "./SortIndicator";
import { useTableColumnResize } from "./useTableColumnResize";
import { TableColumnResizeHandler } from "./dataTableTypes";

import "./TableHeaderCell.css";
import { useContextMenu } from "@finos/vuu-popups";
import { FilterIndicator } from "./filter-indicator";

const classBase = "vuuTable-headerCell";

export interface TableHeaderCellProps
  extends HTMLAttributes<HTMLTableCellElement> {
  column: KeyedColumnDescriptor;
  debugString?: string;
  onDragStart?: (evt: MouseEvent) => void;
  onResize?: TableColumnResizeHandler;
}

export const TableHeaderCell = ({
  column,
  className: classNameProp,
  onClick,
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
  const dragTimerRef = useRef<number | null>(null);

  const handleContextMenu = (e: MouseEvent<HTMLElement>) => {
    showContextMenu(e, "header", { column });
  };

  const handleClick = useCallback(
    (evt: MouseEvent<HTMLTableCellElement>) => !isResizing && onClick?.(evt),
    [isResizing, onClick]
  );

  const handleMouseDown = useCallback(
    (evt: MouseEvent) => {
      dragTimerRef.current = window.setTimeout(() => {
        onDragStart?.(evt);
        dragTimerRef.current = null;
      }, 250);
    },
    [onDragStart]
  );
  const handleMouseUp = useCallback(() => {
    if (dragTimerRef.current !== null) {
      window.clearTimeout(dragTimerRef.current);
      dragTimerRef.current = null;
    }
  }, []);

  const className = cx(classBase, classNameProp, {
    vuuPinFloating: column.pin === "floating",
    vuuPinLeft: column.pin === "left",
    vuuPinRight: column.pin === "right",
    vuuEndPin: column.endPin,
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
        <FilterIndicator column={column} />
        <div className={`${classBase}-label`}>{column.label}</div>
        <SortIndicator sorted={column.sorted} />
        {column.resizeable !== false ? (
          <ColumnResizer {...resizeProps} />
        ) : null}
      </div>
    </th>
  );
};
