import cx from "classnames";
import { HTMLAttributes, useRef } from "react";
import { ColumnResizer } from "./ColumnResizer";
import { TableHeaderCellProps } from "./TableHeaderCell";

import "./TableGroupHeaderCell.css";
import {
  GroupColumnDescriptor,
  KeyedColumnDescriptor,
} from "@finos/vuu-datagrid-types";
import { useTableColumnResize } from "./useTableColumnResize";

const classBase = "vuuTable-groupHeaderCell";

export interface ColHeaderProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
  column: KeyedColumnDescriptor;
  onRemoveColumn?: (column: KeyedColumnDescriptor) => void;
}

const ColHeader = (props: ColHeaderProps) => {
  const { column, className, onRemoveColumn } = props;
  return (
    <div className={cx(`${classBase}-col`, className)} role="columnheader">
      <span className={`${classBase}-label`}>{column.name}</span>
      <span
        className={`${classBase}-close`}
        data-icon="close-circle"
        onClick={() => onRemoveColumn?.(column)}
      />
    </div>
  );
};

export interface TableGroupHeaderCellProps
  extends Omit<TableHeaderCellProps, "onDragStart" | "onDrag" | "onDragEnd"> {
  column: GroupColumnDescriptor;
  onRemoveColumn?: (column: KeyedColumnDescriptor) => void;
}

export const TableGroupHeaderCell = ({
  column: groupColumn,
  className: classNameProp,
  onRemoveColumn,
  onResize,
  ...props
}: TableGroupHeaderCellProps) => {
  const rootRef = useRef<HTMLTableCellElement>(null);
  const { isResizing, ...resizeProps } = useTableColumnResize({
    column: groupColumn,
    onResize,
    rootRef,
  });
  const className = cx(classBase, classNameProp, {
    vuuPinLeft: groupColumn.pin === "left",
    [`${classBase}-right`]: groupColumn.align === "right",
    [`${classBase}-resizing`]: groupColumn.resizing,
    [`${classBase}-pending`]: groupColumn.groupConfirmed === false,
  });
  const { columns } = groupColumn;

  return (
    <th className={className} ref={rootRef} {...props}>
      <div className={`${classBase}-inner`}>
        {columns.map((column) => (
          <ColHeader
            key={column.key}
            column={column}
            onRemoveColumn={onRemoveColumn}
          />
        ))}
        {groupColumn.resizeable !== false ? (
          <ColumnResizer {...resizeProps} />
        ) : null}
      </div>
    </th>
  );
};
