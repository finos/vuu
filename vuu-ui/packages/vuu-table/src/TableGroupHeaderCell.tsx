import cx from "classnames";
import { HTMLAttributes, useRef } from "react";
import { ColumnResizer } from "./ColumnResizer";
import { TableHeaderCellProps } from "./TableHeaderCell";
import {
  GroupColumnDescriptor,
  KeyedColumnDescriptor,
} from "@finos/vuu-datagrid-types";
import { useTableColumnResize } from "./useTableColumnResize";

import "./TableGroupHeaderCell.css";

const classBase = "vuuTable-groupHeaderCell";

interface RemoveButtonProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, "onClick"> {
  column?: KeyedColumnDescriptor;
  onClick?: (column?: KeyedColumnDescriptor) => void;
}
const RemoveButton = ({
  column,
  onClick,
  ...htmlAttributes
}: RemoveButtonProps) => {
  return (
    <span
      {...htmlAttributes}
      className={`${classBase}-close`}
      data-icon="close-circle"
      onClick={() => onClick?.(column)}
    />
  );
};

export interface ColHeaderProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
  column: KeyedColumnDescriptor;
  onRemove?: (column?: KeyedColumnDescriptor) => void;
}

const ColHeader = (props: ColHeaderProps) => {
  const { children, column, className } = props;
  return (
    <div className={cx(`${classBase}-col`, className)} role="columnheader">
      <span className={`${classBase}-label`}>{column.name}</span>
      {children}
    </div>
  );
};

export interface TableGroupHeaderCellProps
  extends Omit<TableHeaderCellProps, "onDragStart" | "onDrag" | "onDragEnd"> {
  column: GroupColumnDescriptor;
  onRemoveColumn?: (column?: KeyedColumnDescriptor) => void;
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
    <div className={className} ref={rootRef} {...props}>
      <div className={`${classBase}-inner`}>
        {columns.map((column) => (
          <ColHeader key={column.key} column={column}>
            {columns.length > 1 ? (
              <RemoveButton column={column} onClick={onRemoveColumn} />
            ) : null}
          </ColHeader>
        ))}
        <RemoveButton data-align="end" onClick={onRemoveColumn} />
        {groupColumn.resizeable !== false ? (
          <ColumnResizer {...resizeProps} />
        ) : null}
      </div>
    </div>
  );
};
