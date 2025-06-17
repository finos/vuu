import {
  getCoreRowModel,
  OnChangeFn,
  useReactTable,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  DataSource,
  DataSourceRow,
  DataSourceSubscribeCallback,
  DataSourceRow as VuuDataSourceRow,
} from "@vuu-ui/vuu-data-types";
import { VuuRange } from "@vuu-ui/vuu-protocol-types";
import {
  getFullRange,
  MovingWindow,
  NULL_RANGE,
  Range,
} from "@vuu-ui/vuu-utils";
import { useCallback, useMemo, useRef, useState } from "react";
import { ColumnMenuProps } from "./ColumnMenu";
import { TableColumnDef } from "./tanstack-table-types";
import {
  tanstackColumnAccessorsToVuuColumnAccessors,
  tanstackSortToVuuSort,
} from "./vuu-tanstack-utils";
import { useTableContextMenu } from "@vuu-ui/vuu-table";

const NO_SELECTION: RowSelectionState = {} as const;
const NO_SORT: SortingState = [] as const;
const NO_VISIBILITY_STATE: VisibilityState = {} as const;

export interface TanstackTableProps<T extends object> {
  /**
   * Should the table support Vuu serverside context menu
   */
  allowContextMenu?: boolean;
  columns: TableColumnDef<T>[];

  dataSource: DataSource;
  /**
   * Pixel height of headers. If specified here, this will take precedence over CSS
   * values and Table will not respond to density changes.
   */
  headerHeight?: number;

  /**
   * Number of rows to render outside the visible viewport. A small number of
   * additional rows smooths the scrolling behaviour and helps avoid white-out
   * at head or tail of scroll area. It also increases rendering work so use
   * with care. Default valus used is 20 (10 leading rows + 10 trailing rows)
   */
  renderBufferSize?: number;
  /**
   * Pixel height of rows.
   */
  rowHeight: number;

  showColumnMenu?: Pick<
    ColumnMenuProps,
    "allowGrouping" | "allowSort" | "allowHide" | "allowInlineFilters"
  >;

  showPaginationControls?: boolean;
}

export const useTanstackTableWithVuuDatasource = <T extends VuuDataSourceRow>({
  allowContextMenu,
  columns,
  dataSource,
  renderBufferSize = 20,
  rowHeight = 32,
}: TanstackTableProps<T>) => {
  const [, forceUpdate] = useState<unknown>(null);
  const data = useRef<VuuDataSourceRow[]>([]);
  // TODO could we calculate contentSize here ?
  const totalRowCountRef = useRef(0);
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
    (viewportRange: VuuRange) => {
      console.log(
        `[useTanstackTableWithVuuDataSource] set (viewport) Range: (${viewportRange.from}:${viewportRange.to}) rowCount = ${totalRowCountRef.current}`,
      );
      const range = Range(viewportRange.from, viewportRange.to, {
        renderBufferSize,
        rowCount: totalRowCountRef.current,
      });
      dataWindow.setRange(range);
      dataSource.range = range;
    },
    [dataSource, dataWindow, renderBufferSize],
  );

  useMemo(() => {
    const dataSourceMessageHandler: DataSourceSubscribeCallback = (message) => {
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
              setTotalRowCount((totalRowCountRef.current = message.size));
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
        range: NULL_RANGE,
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

  const onContextMenu = useTableContextMenu({
    allowContextMenu,
    columns: dataSource.columns.map((name) => ({ name })),
    data: data.current,
    dataSource,
    getSelectedRows: () => dataWindow.getSelectedRows(),
  });

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
    contentHeight: rowHeight * totalRowCount,
    onContextMenu,
    setRange,
    table,
  };
};
