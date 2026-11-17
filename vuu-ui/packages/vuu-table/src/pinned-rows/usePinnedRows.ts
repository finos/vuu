import type { DataSource, TableSchema } from "@vuu-ui/vuu-data-types";
import type {
  SelectionChange,
  SelectionChangeHandler,
  TablePinnedRows,
  TableRowClickHandler,
  TableRowClickHandlerInternal,
} from "@vuu-ui/vuu-table-types";
import {
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePinnedDataSource } from "./usePinnedDataSource";
import { usePinnedRowsScroll } from "./usePinnedRowsScroll";

export const isSelectOperation = ({ type }: SelectionChange) =>
  type === "SELECT_ROW" || type === "SELECT_ROW_RANGE" || type === "SELECT_ALL";

/**
 * Everything the Table needs to render pinned rows.
 */
export interface PinnedRowsModel {
  dataSource: DataSource;
  /**
   * The number of column header rows, pinned rows follow these in
   * aria-rowindex order.
   */
  headerCount: number;
  isScrollable: boolean;
  maxPinnedRows: number;
  maxVisibleRows: number;
  onHeightChange: (height: number) => void;
  onRowClick: TableRowClickHandlerInternal;
  onRowCountChange: (count: number) => void;
  onSelectionChange: (selectionChange: SelectionChange) => void;
  rowCount: number;
  scrollTop: number;
  setScrollbarRef: (el: HTMLDivElement | null) => void;
  visibleHeight: number;
}

export interface PinnedRowsHookProps {
  /**
   * The number of column header rows.
   */
  columnHeaderCount: number;
  containerRef: RefObject<HTMLDivElement | null>;
  dataSource: DataSource;
  onPinnedRowCountChange?: (count: number) => void;
  onRowClick?: TableRowClickHandler;
  onSelectionChange?: SelectionChangeHandler;
  pinnedRows?: TablePinnedRows;
  rowHeight: number;
  tableSchema?: TableSchema;
}

type PinnedRowsState = {
  count: number;
  height: number;
};

export const usePinnedRows = ({
  columnHeaderCount,
  containerRef,
  dataSource,
  onPinnedRowCountChange,
  onRowClick,
  onSelectionChange,
  pinnedRows,
  rowHeight,
  tableSchema,
}: PinnedRowsHookProps) => {
  const { maxPinnedRows, maxVisibleRows, pinnedDataSource } =
    usePinnedDataSource({ dataSource, pinnedRows, tableSchema });

  const [state, setState] = useState<PinnedRowsState>({
    count: 0,
    height: 0,
  });
  const rowCount = pinnedDataSource ? state.count : 0;
  const height = pinnedDataSource ? state.height : 0;

  const handleRowCountChange = useCallback((count: number) => {
    setState((state) => (state.count === count ? state : { ...state, count }));
  }, []);

  const handleHeightChange = useCallback((height: number) => {
    setState((state) =>
      state.height === height ? state : { ...state, height },
    );
  }, []);

  const onPinnedRowCountChangeRef = useRef(onPinnedRowCountChange);
  onPinnedRowCountChangeRef.current = onPinnedRowCountChange;
  useEffect(() => {
    onPinnedRowCountChangeRef.current?.(rowCount);
  }, [rowCount]);

  const {
    isScrollable,
    scrollPinnedRowIntoView,
    scrollTop,
    setScrollbarRef,
    visibleHeight,
  } = usePinnedRowsScroll({
    containerRef,
    headerCount: columnHeaderCount,
    maxVisibleRows,
    rowCount,
    rowHeight,
  });

  const handleRowClick = useCallback<TableRowClickHandlerInternal>(
    (evt, dataRow) => {
      onRowClick?.(evt, dataRow, "pinned");
    },
    [onRowClick],
  );

  // There is a single selection across body and pinned rows, selecting a
  // pinned row clears the body selection.
  const handleSelectionChange = useCallback(
    (selectRequest: SelectionChange) => {
      if (
        isSelectOperation(selectRequest) &&
        dataSource.selectedRowsCount > 0
      ) {
        dataSource.select?.({ type: "DESELECT_ALL" });
        onSelectionChange?.({ type: "DESELECT_ALL" }, "body");
      }
      pinnedDataSource?.select?.(selectRequest);
      onSelectionChange?.(selectRequest, "pinned");
    },
    [dataSource, onSelectionChange, pinnedDataSource],
  );

  const model = useMemo<PinnedRowsModel | undefined>(
    () =>
      pinnedDataSource
        ? {
            dataSource: pinnedDataSource,
            headerCount: columnHeaderCount,
            isScrollable,
            maxPinnedRows,
            maxVisibleRows,
            onHeightChange: handleHeightChange,
            onRowClick: handleRowClick,
            onRowCountChange: handleRowCountChange,
            onSelectionChange: handleSelectionChange,
            rowCount,
            scrollTop,
            setScrollbarRef,
            visibleHeight,
          }
        : undefined,
    [
      columnHeaderCount,
      handleHeightChange,
      handleRowClick,
      handleRowCountChange,
      handleSelectionChange,
      isScrollable,
      maxPinnedRows,
      maxVisibleRows,
      pinnedDataSource,
      rowCount,
      scrollTop,
      setScrollbarRef,
      visibleHeight,
    ],
  );

  return {
    height,
    pinnedRows: model,
    rowCount,
    scrollPinnedRowIntoView,
  };
};
