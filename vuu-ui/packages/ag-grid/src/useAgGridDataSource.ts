import {
  RemoteDataSource,
  SuggestionFetcher,
  useViewserver,
} from "@vuu-ui/data-remote";
import { GridApi, GridOptions, GridReadyEvent } from "ag-grid-community";
import { useCallback, useMemo, useRef } from "react";
import { AgGridServersideRowModelDataSource } from "./AgGridServersideRowModelDataSource";
import { createColumnDefs } from "./createColumnDefs";
import { FilterDataProvider } from "./FilterDataProvider";
import { useAgGridServersideRowModel } from "./useAgGridServersideRowModel";

export const instrumentDataSourceConfig = {
  bufferSize: 100,
  columns: [
    "bbg",
    "currency",
    "description",
    "exchange",
    "isin",
    "lotSize",
    "ric",
  ],
  table: { table: "instruments", module: "SIMUL" },
  serverUrl: "127.0.0.1:8090/websocket",
};

export type AgGridDataSourceHookResult = Pick<
  GridOptions,
  "columnDefs" | "onGridReady" | "rowModelType" | "serverSideInfiniteScroll"
>;

export const useAgGridDataSource = (): AgGridDataSourceHookResult => {
  const { getTypeaheadSuggestions } = useViewserver();
  const getTypeaheadSuggestionsRef = useRef<SuggestionFetcher>(
    getTypeaheadSuggestions
  );
  getTypeaheadSuggestionsRef.current = getTypeaheadSuggestions;

  const filterDataProvider = useMemo(() => {
    return new FilterDataProvider(getTypeaheadSuggestionsRef);
  }, []);

  const agGridDataSource = useAgGridServersideRowModel(
    instrumentDataSourceConfig
  );

  const { columnDefs } = useMemo(() => {
    const columnDefs = createColumnDefs(filterDataProvider);

    return {
      columnDefs,
    };
  }, []);

  const initDataSource = useCallback((gridApi: GridApi) => {
    // const dataSource = new RemoteDataSource(instrumentDataSourceConfig);
    // const agGridDataSource = new AgGridServersideRowModelDataSource(dataSource);
    gridApi.setServerSideDatasource(agGridDataSource);
  }, []);

  const handleGridReady = useCallback(
    (evt: GridReadyEvent) => {
      const { api } = evt;
      initDataSource(api);
    },
    [initDataSource]
  );

  return {
    columnDefs,
    onGridReady: handleGridReady,
    rowModelType: "serverSide",
    serverSideInfiniteScroll: true,
  };
};
