import {
  DataSource,
  DataSourceRow as VuuDataSourceRow,
  SubscribeCallback,
  DataSourceRow,
} from "@finos/vuu-data-types";
import { getFullRange, MovingWindow, NULL_RANGE } from "@finos/vuu-utils";
import {
  getCoreRowModel,
  OnChangeFn,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  useReactTable,
} from "@tanstack/react-table";
import { useCallback, useMemo, useRef, useState } from "react";
import { TableColumnDef } from "./tanstack-table-types";
import {
  tanstackColumnAccessorsToVuuColumnAccessors,
  tanstackSortToVuuSort,
} from "./vuu-tanstack-utils";
import { ColumnMenuProps } from "./ColumnMenu";
import { VuuRange } from "@finos/vuu-protocol-types";

const NO_SELECTION: RowSelectionState = {} as const;
const NO_SORT: SortingState = [] as const;
const NO_VISIBILITY_STATE: VisibilityState = {} as const;

export interface TanstackTableProps<T extends object> {
  columns: TableColumnDef<T>[];

  dataSource: DataSource;
  /**
   * Pixel height of headers. If specified here, this will take precedence over CSS
   * values and Table will not respond to density changes.
   */
  headerHeight?: number;
  /**
   * Pixel height of rows. If specified here, this will take precedence over CSS
   * values and Table will not respond to density changes.
   */
  rowHeight?: number;

  showColumnMenu?: Pick<
    ColumnMenuProps,
    "allowGrouping" | "allowSort" | "allowHide" | "allowInlineFilters"
  >;

  showPaginationControls?: boolean;
}

export const useTanstackTableWithVuuDatasource = <T extends VuuDataSourceRow>({
  columns,
  dataSource,
}: TanstackTableProps<T>) => {
  const [, forceUpdate] = useState<unknown>(null);
  const data = useRef<VuuDataSourceRow[]>([]);
  const [totalRowCount, setTotalRowCount] = useState<number>(dataSource.size);

  const columnsWithVuuAccessors = tanstackColumnAccessorsToVuuColumnAccessors(
    columns as TableColumnDef<VuuDataSourceRow>[],
  );

  const selectionStateRef = useRef<RowSelectionState>(NO_SELECTION);
  const sortStateRef = useRef<SortingState>(NO_SORT);
  const visibilityStateRef = useRef<VisibilityState>(NO_VISIBILITY_STATE);

  const dataWindow = useMemo(
    () => new MovingWindow(getFullRange(NULL_RANGE, 0)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const setData = useCallback(
    (updates: VuuDataSourceRow[]) => {
      for (const row of updates) {
        dataWindow.add(row);
      }

      // We do the slice because an in-place update like a select operation replaces
      // only a single row within the collection. Tanstack table does an identity check
      // on the collection itself.
      data.current = dataWindow.slice();
      // if (isMounted.current) {
      // TODO do we ever need to worry about missing updates here ?
      if (dataWindow.hasAllRowsWithinRange) {
        forceUpdate({});
      }
      // }
    },
    [dataWindow],
  );

  const setRange = useCallback(
    (range: VuuRange) => {
      dataWindow.setRange(range);
      dataSource.range = range;
    },
    [dataSource, dataWindow],
  );

  useMemo(() => {
    const dataSourceMessageHandler: SubscribeCallback = (message) => {
      switch (message.type) {
        case "subscribed":
          console.log(
            "[useTanstackTableWithVuuDataSource] dataSourceMessageHandler subscribed",
          );
          break;
        case "viewport-update":
          {
            if (typeof message.size === "number") {
              dataWindow.setRowCount(message.size);
              setTotalRowCount(message.size);
            }

            if (message.rows) {
              // if (message.range) {
              // TODO why would we ever do this
              // if (message.range.to !== dataWindow.range.to) {
              //   dataWindow.setRange(message.range);
              // }
              // }
              setData(message.rows);
            }
          }
          break;
        default:
          console.log(
            `[useTanstackTableWithVuuDataSource] dataSourceMessageHandler message type ${message.type}`,
          );
      }
    };

    dataSource.subscribe(
      {
        range: { from: 0, to: 0 },
      },
      dataSourceMessageHandler,
    );

    // TODO return unmount handling
  }, [dataSource, dataWindow, setData]);

  const handleSortRequest = useCallback<OnChangeFn<SortingState>>(
    (updaterOrValue) => {
      sortStateRef.current =
        typeof updaterOrValue === "function"
          ? updaterOrValue(sortStateRef.current)
          : updaterOrValue;
      dataSource.sort = tanstackSortToVuuSort(sortStateRef.current);
    },
    [dataSource],
  );

  const handleRowSelectionChange = useCallback<OnChangeFn<RowSelectionState>>(
    (updaterOrValue) => {
      console.log(
        "[useTanstackTableWithVuuDataSource] handleRowSelectionCHange",
      );
      selectionStateRef.current =
        typeof updaterOrValue === "function"
          ? updaterOrValue(selectionStateRef.current)
          : updaterOrValue;

      const selectedIndices = Object.keys(selectionStateRef.current).map((s) =>
        parseInt(s),
      );
      dataSource.select(selectedIndices);
      console.log(JSON.stringify(selectionStateRef.current));
      // forceUpdate({});
    },
    [dataSource],
  );

  const handleColumnVisibilityChange = useCallback<OnChangeFn<VisibilityState>>(
    (updaterOrValue) => {
      console.log(
        "[useTanstackTableWithVuuDataSource] handleColumnVisibilityChange",
      );
      visibilityStateRef.current =
        typeof updaterOrValue === "function"
          ? updaterOrValue(visibilityStateRef.current)
          : updaterOrValue;

      const hiddenColumns = Object.entries(visibilityStateRef.current)
        .filter(([, visible]) => visible === false)
        .map(([name]) => name);
      console.log({ hiddenColumns });

      console.log({ visibilityState: visibilityStateRef.current });
      dataSource.columns = dataSource.columns.filter(
        (col) => !hiddenColumns.includes(col),
      );
    },
    [dataSource],
  );

  const table = useReactTable<DataSourceRow>({
    data: data.current,
    columns: columnsWithVuuAccessors,
    enableMultiRowSelection: false,
    enableRowSelection: true,
    getRowId: (row) => {
      return `${row[0]}`;
    }, // is this right ?
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onSortingChange: handleSortRequest,
    onRowSelectionChange: handleRowSelectionChange,
    getCoreRowModel: getCoreRowModel(),
    // debugTable: true,
    manualPagination: true,
    rowCount: dataSource.size,
    state: {
      columnVisibility: visibilityStateRef.current,
      rowSelection: selectionStateRef.current,
      sorting: sortStateRef.current,
    },
  });

  return {
    dataSource,
    setRange,
    table,
    totalRowCount,
  };
};
