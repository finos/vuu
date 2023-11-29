import {
  GroupColumnDescriptor,
  RuntimeColumnDescriptor,
} from "@finos/vuu-datagrid-types";
import cx from "classnames";
import { useRef } from "react";
import { ColumnResizer, useTableColumnResize } from "../column-resizing";
import { HeaderCellProps } from "./HeaderCell";
import { useCell } from "../useCell";
import { ColumnHeaderPill, GroupColumnPill } from "../column-header-pill";

import "./GroupHeaderCell.css";

const classBase = "vuuTableNextGroupHeaderCell";

export interface GroupHeaderCellProps
  extends Omit<HeaderCellProps, "onDragStart" | "onDrag" | "onDragEnd"> {
  column: GroupColumnDescriptor;
  onRemoveColumn: (column: RuntimeColumnDescriptor) => void;
}

export const GroupHeaderCell = ({
  column: groupColumn,
  className: classNameProp,
  onRemoveColumn,
  onResize,
  ...htmlAttributes
}: GroupHeaderCellProps) => {
  console.log({ groupColumn });
  const rootRef = useRef<HTMLTableCellElement>(null);
  const { isResizing, ...resizeProps } = useTableColumnResize({
    column: groupColumn,
    onResize,
    rootRef,
  });

  const { className, style } = useCell(groupColumn, classBase, true);

  const { columns } = groupColumn;

  const columnPillProps =
    columns.length > 1
      ? {
          removable: true,
          onRemove: onRemoveColumn,
        }
      : undefined;

  return (
    <div
      {...htmlAttributes}
      className={cx(className, "vuuTableNextHeaderCell", {
        [`${classBase}-pending`]: groupColumn.groupConfirmed === false,
      })}
      ref={rootRef}
      role="columnheader"
      style={style}
    >
      <div className={`${classBase}-inner`}>
        {columns.map((column) => {
          return (
            <GroupColumnPill
              {...columnPillProps}
              column={column}
              key={column.key}
            />
          );
        })}
        <ColumnHeaderPill
          column={groupColumn}
          removable
          onRemove={onRemoveColumn}
        />
        {groupColumn.resizeable !== false ? (
          <ColumnResizer {...resizeProps} />
        ) : null}
      </div>
    </div>
  );
};
