import { AgGridReact } from "ag-grid-react";
import { createColumnDefs } from "./createColumnDefs";
import { AgGridViewportDataSource } from "@vuu-ui/ag-grid";
import { SuggestionFetcher, useViewserver } from "@vuu-ui/data-remote";

import "ag-grid-enterprise";
import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-alpine.css";

import {
  authenticate as vuuAuthenticate,
  connectToServer,
  RemoteDataSource,
} from "@vuu-ui/data-remote";
import { CSSProperties, useEffect, useMemo, useRef } from "react";

export const AgGrid = () => {
  const { getTypeaheadSuggestions } = useViewserver();
  const getTypeaheadSuggestionsRef = useRef<SuggestionFetcher>(
    getTypeaheadSuggestions
  );
  getTypeaheadSuggestionsRef.current = getTypeaheadSuggestions;

  const { agGridDataSource, columnDefs } = useMemo(() => {
    const dataConfig = {
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
    const dataSource = new RemoteDataSource(dataConfig);
    const agGridDataSource = new AgGridViewportDataSource(
      dataSource,
      getTypeaheadSuggestionsRef
    );
    const columnDefs = createColumnDefs(agGridDataSource);

    return {
      agGridDataSource,
      columnDefs,
    };
  }, []);

  useEffect(() => {
    const connect = async () => {
      console.log(
        `2 ? [AgGrid.stories] useEffect DataList stories authenticate as steve`
      );
      const authToken = (await vuuAuthenticate("steve", "xyz")) as string;
      connectToServer("127.0.0.1:8090/websocket", authToken);
    };
    connect();
  }, []);

  const layout = {
    display: "grid",
    gridTemplateColumns: "1fr",
    gridTemplateRows: "1fr",
    gap: "10px 20px",
    height: 500,
    margin: "10px auto",
    width: 1000,
  } as CSSProperties;

  return (
    <div style={layout}>
      <div className="ag-theme-alpine">
        <AgGridReact
          columnDefs={columnDefs}
          onFilterChanged={agGridDataSource.handleFilterChanged}
          onFilterModified={agGridDataSource.handleFilterModified}
          onFilterOpened={agGridDataSource.handleFilterOpened}
          onSortChanged={agGridDataSource.handleSortChanged}
          viewportDatasource={agGridDataSource}
          rowModelType="viewport"
        />
      </div>
    </div>
  );
};
