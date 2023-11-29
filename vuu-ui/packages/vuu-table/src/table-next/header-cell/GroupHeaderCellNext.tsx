import {
  GroupColumnDescriptor,
  RuntimeColumnDescriptor,
} from "@finos/vuu-datagrid-types";
import cx from "classnames";
import { useCallback, useRef, useState } from "react";
import { ColumnResizer, useTableColumnResize } from "../column-resizing";
import { HeaderCellProps } from "./HeaderCell";
import { useCell } from "../useCell";
import { ColumnHeaderPill, GroupColumnPill } from "../column-header-pill";
import { OverflowContainer, useLayoutEffectSkipFirst } from "@finos/vuu-layout";

import "./GroupHeaderCell.css";

const classBase = "vuuTableNextGroupHeaderCell";

const switchIfChanged = (
  columns: RuntimeColumnDescriptor[],
  newColumns: RuntimeColumnDescriptor[]
) => {
  if (columns === newColumns) {
    return columns;
  } else {
    return newColumns;
  }
};

export interface GroupHeaderCellNextProps
  extends Omit<HeaderCellProps, "onDragStart" | "onDrag" | "onDragEnd"> {
  column: GroupColumnDescriptor;
  onRemoveColumn: (column: RuntimeColumnDescriptor) => void;
}

export const GroupHeaderCellNext = ({
  column: groupColumn,
  className: classNameProp,
  onRemoveColumn,
  onResize,
  ...htmlAttributes
}: GroupHeaderCellNextProps) => {
  const rootRef = useRef<HTMLTableCellElement>(null);
  const { isResizing, ...resizeProps } = useTableColumnResize({
    column: groupColumn,
    onResize,
    rootRef,
  });

  const [columns, setColumns] = useState(groupColumn.columns);
  const { className, style } = useCell(groupColumn, classBase, true);
  const columnPillProps =
    columns.length > 1
      ? {
          removable: true,
          onRemove: onRemoveColumn,
        }
      : undefined;

  const handleMoveItem = useCallback((fromIndex, toIndex) => {
    setColumns((cols) => {
      const newCols = cols.slice();
      const [tab] = newCols.splice(fromIndex, 1);
      if (toIndex === -1) {
        return newCols.concat(tab);
      } else {
        newCols.splice(toIndex, 0, tab);
        return newCols;
      }
    });
  }, []);

  useLayoutEffectSkipFirst(() => {
    setColumns((cols) => switchIfChanged(cols, groupColumn.columns));
  }, [groupColumn.columns]);

  return (
    <div
      {...htmlAttributes}
      className={cx(className, "vuuTableNextHeaderCell", classNameProp, {
        [`${classBase}-pending`]: groupColumn.groupConfirmed === false,
      })}
      ref={rootRef}
      role="columnheader"
      style={style}
    >
      <OverflowContainer
        allowDragDrop
        className={`${classBase}-inner`}
        height={24}
        onMoveItem={handleMoveItem}
        overflowPosition="start"
      >
        {columns.map((column) => {
          return (
            <GroupColumnPill
              {...columnPillProps}
              column={column}
              key={column.key}
            />
          );
        })}
      </OverflowContainer>
      <ColumnHeaderPill
        column={groupColumn}
        removable
        onRemove={onRemoveColumn}
      />

      {groupColumn.resizeable !== false ? (
        <ColumnResizer {...resizeProps} />
      ) : null}
    </div>
  );
};
