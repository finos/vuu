import { AgGridReact } from "ag-grid-react";
import { createColumnDefs } from "./createColumnDefs";
import { instrumentDataSourceConfig } from "./dataSourceConfig";
import {
  AgGridViewportRowModelDataSource,
  useAgGridDataSource,
} from "@vuu-ui/ag-grid";
import { SuggestionFetcher, useViewserver } from "@vuu-ui/data-remote";
import { ToolkitProvider } from "@heswell/uitk-core";

import "ag-grid-enterprise";
import "ag-grid-community/dist/styles/ag-grid.css";
import "./VuuGrid.css";
import "./VuuAgGrid.css";
import "ag-grid-community/dist/styles/ag-theme-balham.css";

import {
  authenticate as vuuAuthenticate,
  connectToServer,
  RemoteDataSource,
} from "@vuu-ui/data-remote";
import { CSSProperties, useEffect, useMemo, useRef } from "react";

export const AgGridViewportRowModel = () => {
  const { getTypeaheadSuggestions } = useViewserver();
  const getTypeaheadSuggestionsRef = useRef<SuggestionFetcher>(
    getTypeaheadSuggestions
  );
  getTypeaheadSuggestionsRef.current = getTypeaheadSuggestions;

  const { agGridDataSource, columnDefs } = useMemo(() => {
    const dataSource = new RemoteDataSource(instrumentDataSourceConfig);
    const agGridDataSource = new AgGridViewportRowModelDataSource(
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
    width: 800,
  } as CSSProperties;

  return (
    <div style={layout}>
      <div className="ag-theme-balham">
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

export const AgGridServersideRowModel = () => {
  const gridConfig = useAgGridDataSource();

  useEffect(() => {
    const connect = async () => {
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
    width: 800,
  } as CSSProperties;

  return (
    <ToolkitProvider density="high">
      <div style={layout}>
        <div className="ag-theme-balham">
          <AgGridReact {...gridConfig} headerHeight={18} rowHeight={18} />
        </div>
      </div>
    </ToolkitProvider>
  );
};
