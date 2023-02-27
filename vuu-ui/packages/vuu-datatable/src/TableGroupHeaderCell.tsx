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
  column,
  className: classNameProp,
  onRemoveColumn,
  onResize,
  ...props
}: TableGroupHeaderCellProps) => {
  const rootRef = useRef<HTMLTableCellElement>(null);
  const { isResizing, ...resizeProps } = useTableColumnResize({
    column,
    onResize,
    rootRef,
  });
  const className = cx(classBase, classNameProp, {
    vuuPinLeft: column.pin === "left",
    [`${classBase}-right`]: column.align === "right",
    [`${classBase}-resizing`]: column.resizing,
  });
  const { columns } = column;

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

        {column.resizeable !== false ? (
          <ColumnResizer {...resizeProps} />
        ) : null}
      </div>
    </th>
  );
};
