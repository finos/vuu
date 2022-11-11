import {
  DataSourceProps,
  SuggestionFetcher,
  useViewserver,
} from "@vuu-ui/vuu-data";
import { VuuTable } from "../../vuu-protocol-types";
import {
  ColumnRowGroupChangedEvent,
  FilterChangedEvent,
  FilterOpenedEvent,
  GetRowIdParams,
  GridApi,
  GridOptions,
  GridReadyEvent,
  RowGroupOpenedEvent,
  SortChangedEvent,
} from "ag-grid-community";
import { useCallback, useMemo, useRef } from "react";
import { AgGridServersideRowModelDataSource } from "./AgGridServersideRowModelDataSource";
import { FilterDataProvider } from "./FilterDataProvider";

export type AgGridDataSourceHookResult = Pick<
  GridOptions,
  | "cacheBlockSize"
  | "defaultColDef"
  | "getRowId"
  | "maxBlocksInCache"
  | "onColumnRowGroupChanged"
  | "onFilterChanged"
  | "onFilterOpened"
  | "onGridReady"
  | "onRowGroupOpened"
  | "onSortChanged"
  | "purgeClosedRowNodes"
  | "rowModelType"
  | "serverSideInfiniteScroll"
  | "serverSideStoreType"
> & { createFilterDataProvider: (table: VuuTable) => FilterDataProvider };

export const useAgGridDataSource = (
  config: DataSourceProps,
  tableKey = "bbg"
): AgGridDataSourceHookResult => {
  const { getTypeaheadSuggestions } = useViewserver();
  const getTypeaheadSuggestionsRef = useRef<SuggestionFetcher>(
    getTypeaheadSuggestions
  );

  getTypeaheadSuggestionsRef.current = getTypeaheadSuggestions;

  const dataSource = useMemo(() => {
    return new AgGridServersideRowModelDataSource(config);
  }, [config]);

  const createFilterDataProvider = useCallback((table: VuuTable) => {
    return new FilterDataProvider(table, getTypeaheadSuggestionsRef);
  }, []);

  const initDataSource = useCallback(
    (gridApi: GridApi) => {
      dataSource.setGridApi(gridApi);
      gridApi.setServerSideDatasource(dataSource);
    },
    [dataSource]
  );

  const handleGridReady = useCallback(
    (evt: GridReadyEvent) => {
      const { api } = evt;
      initDataSource(api);
    },
    [initDataSource]
  );

  const onRowGroupOpened = useCallback(
    (evt: RowGroupOpenedEvent) => {
      dataSource.toggleGroupNode(evt);
    },
    [dataSource]
  );

  const onColumnRowGroupChanged = useCallback(
    (evt: ColumnRowGroupChangedEvent) => {
      dataSource.columRowGroupChanged(evt);
    },
    [dataSource]
  );

  const onFilterOpened = useCallback((evt: FilterOpenedEvent) => {
    const { column } = evt;
    console.log(`Filter OPENED on ${column.getId()}`, {
      evt,
    });
  }, []);

  const onFilterChanged = useCallback(
    (evt: FilterChangedEvent) => {
      dataSource.filterChanged(evt);
    },
    [dataSource]
  );

  const onSortChanged = useCallback(
    (evt: SortChangedEvent) => {
      dataSource.sortChanged(evt);
    },
    [dataSource]
  );

  const getRowId = useMemo(
    () => (params: GetRowIdParams) => params.data[tableKey],
    [tableKey]
  );

  return {
    cacheBlockSize: 100,
    createFilterDataProvider,
    defaultColDef: {
      sortable: true,
    },
    getRowId,
    maxBlocksInCache: 1,
    onFilterChanged,
    onColumnRowGroupChanged,
    onFilterOpened,
    onGridReady: handleGridReady,
    onRowGroupOpened,
    onSortChanged,
    purgeClosedRowNodes: true,
    rowModelType: "serverSide",
    serverSideInfiniteScroll: true,
    serverSideStoreType: "partial",
  };
};
