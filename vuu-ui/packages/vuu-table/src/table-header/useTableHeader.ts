import { ColumnDescriptor, TableHeadings } from "@vuu-ui/vuu-table-types";
import {
  DropOptions,
  useDragDrop as useDragDrop,
} from "@vuu-ui/vuu-ui-controls";
import {
  moveColumnTo,
  queryClosest,
  visibleColumnAtIndex,
} from "@vuu-ui/vuu-utils";
import { RefCallback, useCallback, useRef } from "react";
import { TableHeaderProps } from "./TableHeader";
import { useMeasuredHeight } from "../useMeasuredHeight";
import { useForkRef } from "@salt-ds/core";

export interface TableHeaderHookProps
  extends Pick<
    TableHeaderProps,
    | "allowDragColumnHeader"
    | "columns"
    | "onMoveColumn"
    | "onSortColumn"
    | "tableConfig"
  > {
  customHeaderCount: number;
  headings: TableHeadings;
  label?: string;
  onHeightMeasured: (height: number, customHeaderCount: number) => void;
  onMoveColumn: (columns: ColumnDescriptor[]) => void;
  onSortColumn: (column: ColumnDescriptor, addToExistingSort: boolean) => void;
}

export const useTableHeader = ({
  allowDragColumnHeader,
  columns,
  customHeaderCount,
  headings,
  onHeightMeasured,
  onMoveColumn,
  onSortColumn,
  tableConfig,
}: TableHeaderHookProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollingContainerRef = useRef<HTMLDivElement | null>(null);

  const handleHeightMeasured = useCallback(
    (height: number) => {
      onHeightMeasured(height, customHeaderCount + headings.length + 1);
    },
    [customHeaderCount, headings, onHeightMeasured],
  );

  const { measuredRef: rowRef } = useMeasuredHeight({
    onHeightMeasured: handleHeightMeasured,
  });

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
    [columns, onMoveColumn, tableConfig.columns],
  );

  const handleColumnHeaderClick = useCallback(
    (evt: React.MouseEvent | React.KeyboardEvent) => {
      const headerCell = queryClosest(evt.target, ".vuuTableHeaderCell");
      const colIdx = parseInt(headerCell?.dataset.index ?? "-1");
      const column = visibleColumnAtIndex(columns, colIdx);
      const isAdditive = evt.shiftKey;
      column && onSortColumn(column, isAdditive);
    },
    [columns, onSortColumn],
  );

  // Drag Drop column headers
  const {
    onMouseDown: columnHeaderDragMouseDown,
    draggable: draggableColumn,
    ...dragDropHook
  } = useDragDrop({
    allowDragDrop: allowDragColumnHeader,
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
    setContainerRef: useForkRef(setContainerRef, rowRef),
  };
};
