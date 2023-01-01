import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import cx from "classnames";
import { HTMLAttributes, MouseEvent, useCallback } from "react";
import { ColumnResizer } from "./ColumnResizer";

import "./TableHeaderCell.css";

const classBase = "vuuTable-headerCell";

export interface TableHeaderCellProps
  extends HTMLAttributes<HTMLTableCellElement> {
  column: KeyedColumnDescriptor;
  debugString?: string;
  onDragStart?: (evt: MouseEvent) => void;
  onDragEnd?: () => void;
}

export const TableHeaderCell = ({
  column,
  className: classNameProp,
  onDragEnd,
  onDragStart,
  ...props
}: TableHeaderCellProps) => {
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
    [`${classBase}-right`]: column.align === "right",
  });
  return (
    <th
      className={className}
      {...props}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div className={`${classBase}-inner`}>
        <div className={`${classBase}-label`}>{column.label}</div>
        {column.resizeable !== false ? <ColumnResizer /> : null}
      </div>
    </th>
  );
};
