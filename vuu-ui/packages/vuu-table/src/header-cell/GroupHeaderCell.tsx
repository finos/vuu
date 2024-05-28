import { OverflowContainer } from "@finos/vuu-ui-controls";
import {
  ColumnDescriptor,
  GroupColumnDescriptor,
  HeaderCellProps,
  RuntimeColumnDescriptor,
} from "@finos/vuu-table-types";
import { useLayoutEffectSkipFirst } from "@finos/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { useCallback, useRef, useState } from "react";
import { ColumnHeaderPill, GroupColumnPill } from "../column-header-pill";
import { ColumnResizer, useTableColumnResize } from "../column-resizing";
import { useCell } from "../useCell";

import headerCellCss from "./GroupHeaderCell.css";

const classBase = "vuuTableGroupHeaderCell";

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

export interface GroupHeaderCellProps
  extends Omit<HeaderCellProps, "onDragStart" | "onDrag" | "onDragEnd"> {
  column: GroupColumnDescriptor;
  onMoveColumn?: (columns: ColumnDescriptor[]) => void;
  onRemoveColumn: (column: RuntimeColumnDescriptor) => void;
}

export const GroupHeaderCell = ({
  column: groupColumn,
  className: classNameProp,
  onMoveColumn,
  onRemoveColumn,
  onResize,
  ...htmlAttributes
}: GroupHeaderCellProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-group-header-cell",
    css: headerCellCss,
    window: targetWindow,
  });

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

  const handleMoveItem = useCallback(
    (fromIndex, toIndex) => {
      setColumns((cols) => {
        const newCols = cols.slice();
        const [tab] = newCols.splice(fromIndex, 1);
        if (toIndex === -1) {
          const result = newCols.concat(tab);
          onMoveColumn?.(result);
          return result;
        } else {
          newCols.splice(toIndex, 0, tab);
          onMoveColumn?.(newCols);
          return newCols;
        }
      });
    },
    [onMoveColumn]
  );

  useLayoutEffectSkipFirst(() => {
    setColumns((cols) => switchIfChanged(cols, groupColumn.columns));
  }, [groupColumn.columns]);

  return (
    <div
      {...htmlAttributes}
      className={cx(className, classNameProp, {
        [`${classBase}-pending`]: groupColumn.groupConfirmed === false,
      })}
      ref={rootRef}
      role="columnheader"
      style={style}
    >
      <OverflowContainer
        allowDragDrop
        className={`${classBase}-inner`}
        onMoveItem={handleMoveItem}
        overflowPosition="start"
      >
        {columns.map((column) => {
          return (
            <GroupColumnPill
              {...columnPillProps}
              column={column}
              key={column.name}
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
