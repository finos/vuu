import { ColumnDescriptor } from "@finos/vuu-table-types";
import {
  DropOptions,
  useDragDrop as useDragDrop,
} from "@finos/vuu-ui-controls";
import { moveColumnTo, visibleColumnAtIndex } from "@finos/vuu-utils";
import { MouseEventHandler, RefCallback, useCallback, useRef } from "react";
import { TableHeaderProps } from "./TableHeader";

export interface TableHeaderHookProps
  extends Pick<
    TableHeaderProps,
    "columns" | "onMoveColumn" | "onSortColumn" | "tableConfig"
  > {
  label?: string;
  onMoveColumn: (columns: ColumnDescriptor[]) => void;
  onSortColumn: (column: ColumnDescriptor, addToExistingSort: boolean) => void;
}

export const useTableHeader = ({
  columns,
  onMoveColumn,
  onSortColumn,
  tableConfig,
}: TableHeaderHookProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollingContainerRef = useRef<HTMLDivElement | null>(null);
  const setContainerRef = useCallback<RefCallback<HTMLDivElement>>((el) => {
    containerRef.current = el;
    if (el) {
      scrollingContainerRef.current = el.closest(".vuuTable-contentContainer");
    } else {
      scrollingContainerRef.current = null;
    }
  }, []);

  const handleDropColumnHeader = useCallback(
    ({ fromIndex: moveFrom, toIndex: moveTo }: DropOptions) => {
      const column = columns[moveFrom];
      // columns are what get rendered, so these are the columns that
      // the drop operation relates to. We must translate these into
      // columns within the table config. Grouping complicates this
      // as the group columns are not present in columns but ARE in
      // config.columns
      const orderedColumns = moveColumnTo(columns, column, moveTo);

      const ofColumn =
        ({ name }: ColumnDescriptor) =>
        (col: ColumnDescriptor) =>
          col.name === name;

      const targetIndex = orderedColumns.findIndex(ofColumn(column));
      const nextColumn = orderedColumns[targetIndex + 1];
      const insertPos = nextColumn
        ? tableConfig.columns.findIndex(ofColumn(nextColumn))
        : -1;

      if (moveTo > moveFrom && insertPos !== -1) {
        onMoveColumn(moveColumnTo(tableConfig.columns, column, insertPos - 1));
      } else {
        onMoveColumn(moveColumnTo(tableConfig.columns, column, insertPos));
      }
    },
    [columns, onMoveColumn, tableConfig.columns]
  );

  const handleColumnHeaderClick = useCallback<
    MouseEventHandler<HTMLDivElement>
  >(
    (evt) => {
      const targetElement = evt.target as HTMLElement;
      const headerCell = targetElement.closest(
        ".vuuTableHeaderCell"
      ) as HTMLElement;
      const colIdx = parseInt(headerCell?.dataset.index ?? "-1");
      const column = visibleColumnAtIndex(columns, colIdx);
      const isAdditive = evt.shiftKey;
      column && onSortColumn(column, isAdditive);
    },
    [columns, onSortColumn]
  );

  // Drag Drop column headers
  const {
    onMouseDown: columnHeaderDragMouseDown,
    draggable: draggableColumn,
    ...dragDropHook
  } = useDragDrop({
    allowDragDrop: true,
    containerRef,
    draggableClassName: `vuuTable`,
    itemQuery: ".vuuTableHeaderCell",
    onDrop: handleDropColumnHeader,
    orientation: "horizontal",
    scrollingContainerRef,
  });

  return {
    draggableColumn,
    draggedColumnIndex: dragDropHook.draggedItemIndex,
    onClick: handleColumnHeaderClick,
    onMouseDown: columnHeaderDragMouseDown,
    setContainerRef,
  };
};
