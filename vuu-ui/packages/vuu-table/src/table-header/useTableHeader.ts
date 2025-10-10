import {
  ColumnDescriptor,
  RuntimeColumnDescriptor,
  TableHeadings,
} from "@vuu-ui/vuu-table-types";
import {
  queryClosest,
  reorderColumnItems,
  visibleColumnAtIndex,
} from "@vuu-ui/vuu-utils";
import { RefCallback, useCallback, useRef, useState } from "react";
import { TableHeaderProps } from "./TableHeader";
import { useMeasuredHeight } from "../useMeasuredHeight";
import { useForkRef } from "@salt-ds/core";

export interface TableHeaderHookProps
  extends Pick<
    TableHeaderProps,
    "columns" | "onMoveColumn" | "onSortColumn" | "tableConfig"
  > {
  customHeaderCount: number;
  headings: TableHeadings;
  label?: string;
  onHeightMeasured: (height: number, customHeaderCount: number) => void;
  onMoveColumn: (columnName: string, columns: ColumnDescriptor[]) => void;
  onSortColumn: (column: ColumnDescriptor, addToExistingSort: boolean) => void;
}

export type DragColumn = {
  id: string;
  column: RuntimeColumnDescriptor;
};

export const useTableHeader = ({
  columns,
  customHeaderCount,
  headings,
  onHeightMeasured,
  onMoveColumn,
  onSortColumn,
}: TableHeaderHookProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollingContainerRef = useRef<HTMLDivElement | null>(null);
  const [dragColumn, setDragColumn] = useState<DragColumn | null>(null);

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

  // const handleDropColumnHeader = useCallback(
  //   ({ fromIndex: moveFrom, toIndex: moveTo }: DropOptions) => {
  //     const column = columns[moveFrom];
  //     // columns are what get rendered, so these are the columns that
  //     // the drop operation relates to. We must translate these into
  //     // columns within the table config. Grouping complicates this
  //     // as the group columns are not present in columns but ARE in
  //     // config.columns
  //     const orderedColumns = moveColumnTo(columns, column, moveTo);

  //     const ofColumn =
  //       ({ name }: ColumnDescriptor) =>
  //       (col: ColumnDescriptor) =>
  //         col.name === name;

  //     const targetIndex = orderedColumns.findIndex(ofColumn(column));
  //     const nextColumn = orderedColumns[targetIndex + 1];
  //     const insertPos = nextColumn
  //       ? tableConfig.columns.findIndex(ofColumn(nextColumn))
  //       : -1;

  //     if (moveTo > moveFrom && insertPos !== -1) {
  //       onMoveColumn(
  //         dragColumn?.column?.name,
  //         moveColumnTo(tableConfig.columns, column, insertPos - 1),
  //       );
  //     } else {
  //       onMoveColumn(moveColumnTo(tableConfig.columns, column, insertPos));
  //     }
  //   },
  //   [columns, onMoveColumn, tableConfig.columns],
  // );

  const handleDragStart = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (evt: any) => {
      const element = evt.operation.source as HTMLDivElement;
      const columnName = element.id.split("-").at(-1);
      const column = columns.find((col) => col.name === columnName);
      if (column === undefined) {
        throw Error(`[useTableHeader] No column '${columnName}'`);
      }
      setDragColumn({ column, id: element.id });
    },
    [columns],
  );

  const handleDragEnd = useCallback(() => {
    setTimeout(() => {
      const listItems = containerRef.current?.querySelectorAll<HTMLDivElement>(
        ".vuuTableHeaderCell",
      );

      if (listItems && dragColumn?.column) {
        const orderedColumnNames = Array.from<HTMLDivElement>(listItems).map(
          ({ dataset }) => dataset.columnName as string,
        );
        onMoveColumn(
          dragColumn?.column.name,
          reorderColumnItems(columns, orderedColumnNames),
        );
      }
    }, 300);
  }, [columns, dragColumn, onMoveColumn]);

  const handleColumnHeaderClick = useCallback(
    (evt: React.MouseEvent | React.KeyboardEvent) => {
      const headerCell = queryClosest(evt.target, ".vuuTableHeaderCell");
      const colIdx = parseInt(headerCell?.dataset.index ?? "-1");
      const column = visibleColumnAtIndex(columns, colIdx);
      if (column && column.sortable !== false) {
        const isAdditive = evt.shiftKey;
        onSortColumn(column, isAdditive);
      }
    },
    [columns, onSortColumn],
  );

  return {
    dragColumn,
    onClick: handleColumnHeaderClick,
    onDragEnd: handleDragEnd,
    onDragStart: handleDragStart,
    setContainerRef: useForkRef(setContainerRef, rowRef),
  };
};
