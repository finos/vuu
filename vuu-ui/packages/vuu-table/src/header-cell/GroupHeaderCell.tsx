import {
  ColumnDescriptor,
  GroupColumnDescriptor,
  HeaderCellProps,
  RuntimeColumnDescriptor,
} from "@vuu-ui/vuu-table-types";
import { OverflowContainer } from "@vuu-ui/vuu-ui-controls";
import { useLayoutEffectSkipFirst } from "@vuu-ui/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  KeyboardEventHandler,
  MouseEventHandler,
  useCallback,
  useRef,
  useState,
} from "react";
import { ColumnHeaderPill, GroupColumnPill } from "../column-header-pill";
import { ColumnResizer, useTableColumnResize } from "../column-resizing";
import { useCell } from "../useCell";

import headerCellCss from "./GroupHeaderCell.css";

const classBase = "vuuTableGroupHeaderCell";

const switchIfChanged = (
  columns: RuntimeColumnDescriptor[],
  newColumns: RuntimeColumnDescriptor[],
) => {
  if (columns === newColumns) {
    return columns;
  } else {
    return newColumns;
  }
};

export interface GroupHeaderCellProps
  extends Omit<
    HeaderCellProps,
    "id" | "index" | "onDragStart" | "onDrag" | "onDragEnd"
  > {
  column: GroupColumnDescriptor;
  id?: string;
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
    (fromIndex: number, toIndex: number) => {
      setColumns((cols) => {
        const newCols = cols.slice();
        const [tab] = newCols.splice(fromIndex, 1);
        if (toIndex === -1) {
          const result = newCols.concat(tab);
          requestAnimationFrame(() => onMoveColumn?.(result));
          return result;
        } else {
          newCols.splice(toIndex, 0, tab);
          requestAnimationFrame(() => onMoveColumn?.(newCols));
          return newCols;
        }
      });
    },
    [onMoveColumn],
  );

  useLayoutEffectSkipFirst(() => {
    setColumns((cols) => switchIfChanged(cols, groupColumn.columns));
  }, [groupColumn.columns]);

  const handleClick = useCallback<MouseEventHandler<HTMLSpanElement>>(() => {
    console.log("click");
  }, []);
  const handleKeyDown = useCallback<
    KeyboardEventHandler<HTMLSpanElement>
  >(() => {
    console.log("keydown");
  }, []);

  return (
    <div
      {...htmlAttributes}
      aria-colindex={groupColumn.ariaColIndex}
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
              onClick={handleClick}
              onKeyDown={handleKeyDown}
            />
          );
        })}
      </OverflowContainer>
      <ColumnHeaderPill
        className={`${classBase}-removeAll`}
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
