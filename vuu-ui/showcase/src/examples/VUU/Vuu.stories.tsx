import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Grid, GridProvider } from "@vuu-ui/vuu-datagrid";
import { ContextMenuProvider } from "@vuu-ui/ui-controls";
import { StackLayout as Stack, View, useViewContext } from "@vuu-ui/vuu-layout";
import { Button } from "@heswell/uitk-core";
import { List, ListItem } from "@heswell/uitk-lab";
import { useTestDataSource } from "../utils/useTestDataSource";

import {
  authenticate as vuuAuthenticate,
  connectToServer,
  RemoteDataSource,
  useViewserver,
} from "@vuu-ui/vuu-data";

import { ParsedInput, ParserProvider } from "@vuu-ui/parsed-input";
import { parseFilter, extractFilter } from "@vuu-ui/datagrid-parsers";
import { createSuggestionProvider } from "./vuu-filter-suggestion-provider";
import { testTableMeta } from "./Vuu.data";

let displaySequence = 1;

const { columns, dataTypes } = testTableMeta.instruments;
const instrumentColumns = columns.map((name, index) => {
  return {
    name,
    type: dataTypes[index],
  };
});

export const VuuTables = () => {
  const { tables } = useViewserver();

  useEffect(() => {
    const connect = async () => {
      const authToken = (await vuuAuthenticate("steve", "xyz")) as string;
      connectToServer("127.0.0.1:8090/websocket", authToken);
    };
    connect();
  }, []);

  return (
    <List>
      {Object.entries(tables).map(([table, schema]) => (
        <ListItem>{`[${schema.table.module}] ${schema.table.table}`}</ListItem>
      ))}
    </List>
  );
};

const schemaColumns = [
  { name: "bbg", serverDataType: "string" } as const,
  { name: "description", serverDataType: "string" } as const,
  { name: "currency", serverDataType: "string" } as const,
  { name: "exchange", serverDataType: "string" } as const,
  { name: "lotSize", serverDataType: "int" } as const,
  { name: "isin", serverDataType: "string" } as const,
  { name: "ric", serverDataType: "string" } as const,
];

export const VuuInstruments = () => {
  const gridRef = useRef(null);
  const [namedFilters, setNamedFilters] = useState([]);
  const [token, setToken] = useState();
  const { dataSource, instrumentColumns } = useTestDataSource({
    autoLogin: false,
  });

  const onRpcResponse = useCallback((response) => {
    console.log(`handleRpcResponse ${JSON.stringify(response)}`);
  }, []);

  const {
    buildViewserverMenuOptions,
    dispatchGridAction,
    handleMenuAction,
    makeRpcCall,
  } = useViewserver({
    rpcServer: dataSource,
    onRpcResponse,
  });

  const handleCommit = (result) => {
    const { filter, name } = extractFilter(result);
    dataSource.filter(filter);
    if (name) {
      setNamedFilters(namedFilters.concat({ name, filter }));
    }
  };

  const getSuggestions = useCallback(
    async (params) => {
      return await makeRpcCall({
        type: "RPC_CALL",
        method: "getUniqueFieldValues",
        params,
      });
    },
    [makeRpcCall]
  );

  const authenticate = useCallback(async () => {
    const authToken = await vuuAuthenticate("steve", "xyz");
    setToken(authToken);
  }, []);

  const connect = useCallback(() => {
    console.log(`connect with new token  ${token}`);
    connectToServer("127.0.0.1:8090/websocket", token);
  }, [token]);

  return (
    <div
      style={{
        "--hwParsedInput-border-style": "solid solid solid none",
        "--hwParsedInput-height": "24px",
        "--hwParsedInput-input-font-size": "14px",
        width: 600,
        height: 700,
      }}
    >
      <div>
        <Button onClick={authenticate}>authenticate</Button>
        <Button onClick={connect}>Connect</Button>
      </div>
      <ParserProvider
        parser={parseFilter}
        suggestionProvider={createSuggestionProvider({
          columns: schemaColumns,
          namedFilters,
          getSuggestions,
          table: { table: "instruments", module: "SIMUL" },
        })}
      >
        <div>
          <ParsedInput onCommit={handleCommit} />
        </div>
      </ParserProvider>

      <ContextMenuProvider
        label="App"
        menuActionHandler={handleMenuAction}
        menuBuilder={buildViewserverMenuOptions}
      >
        <GridProvider value={{ dispatchGridAction }}>
          <Grid
            dataSource={dataSource}
            columns={instrumentColumns}
            columnSizing="fill"
            height={600}
            ref={gridRef}
            selectionModel="extended"
          />
        </GridProvider>
      </ContextMenuProvider>
    </div>
  );
};

VuuInstruments.displaySequence = displaySequence++;

const instrumentConfig = {
  bufferSize: 100,
  columns: instrumentColumns.map((col) => col.name),
  tableName: { table: "instruments", module: "SIMUL" },
  serverUrl: "127.0.0.1:8090/websocket",
};

// Where would this go ?
export const useViewState = (config) => {
  const { loadSession, onConfigChange, saveSession } = useViewContext();

  const dataSource = useMemo(() => {
    let ds = loadSession("data-source");
    if (ds) {
      console.log("%cdatasource retrieved from session state", "color: purple");
      return ds;
    }
    ds = new RemoteDataSource(config);
    saveSession(ds, "data-source");
    return ds;
  }, [config, loadSession, saveSession]);

  return [dataSource, onConfigChange];
};

const InstrumentGrid = ({ sort }) => {
  const [dataSource, onConfigChange] = useViewState(instrumentConfig);

  useViewserver({ dataSource });

  useEffect(() => {
    dataSource.enable();
    return () => {
      dataSource.disable();
    };
  }, [dataSource]);

  return (
    <Grid
      dataSource={dataSource}
      columns={instrumentColumns}
      sort={
        sort ?? [
          {
            column: "currency",
            sortType: "A",
          },
        ]
      }
      height={600}
      onConfigChange={onConfigChange}
      selectionModel="extended"
    />
  );
};

export const TabbedTables = () => {
  const gridRef = useRef(null);
  const [namedFilters, setNamedFilters] = useState([]);

  const onRpcResponse = useCallback((response) => {
    console.log(`handleRpcResponse ${JSON.stringify(response)}`);
  }, []);

  const dataConfig = {
    bufferSize: 100,
    columns: instrumentColumns.map((col) => col.name),
    tableName: { table: "instruments", module: "SIMUL" },
    serverUrl: "127.0.0.1:8090/websocket",
  };

  const dataSource = useMemo(() => new RemoteDataSource(dataConfig), []);
  const { buildViewserverMenuOptions, dispatchGridAction, handleMenuAction } =
    useViewserver({
      dataSource,
      onRpcResponse,
    });

  const handleCommit = (result) => {
    const { filter, name } = extractFilter(result);
    dataSource.filterQuery(filter);
    if (name) {
      setNamedFilters(namedFilters.concat({ name, filter }));
    }
  };

  const handleLayoutChange = useCallback((layout) => {
    console.log(`onLAyout change ${JSON.stringify(layout, null, 2)}`);
  });

  return (
    <Stack
      showTabs
      style={{ width: "100%", height: 600 }}
      onLayoutChange={handleLayoutChange}
    >
      <View title="Instruments 1">
        <InstrumentGrid />
      </View>
      <View title="Instruments 2">
        <InstrumentGrid />
      </View>
    </Stack>
  );
};
