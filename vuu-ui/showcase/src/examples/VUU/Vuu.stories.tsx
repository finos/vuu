import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Grid } from "@finos/vuu-datagrid";
import { StackLayout as Stack, View, useViewContext } from "@finos/vuu-layout";
import { List, ListItem } from "@heswell/salt-lab";

import {
  authenticate as vuuAuthenticate,
  connectToServer,
  RemoteDataSource,
  useVuuMenuActions,
  useVuuTables,
} from "@finos/vuu-data";

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
  const tables = useVuuTables();

  useEffect(() => {
    const connect = async () => {
      const authToken = (await vuuAuthenticate("steve", "xyz")) as string;
      connectToServer("127.0.0.1:8090/websocket", authToken);
    };
    connect();
  }, []);

  return (
    <List width={200}>
      {tables
        ? Array.from(tables.entries()).map(([tableName, schema]) => (
            <ListItem
              key={tableName}
            >{`[${schema.table.module}] ${schema.table.table}`}</ListItem>
          ))
        : null}
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

  useVuuMenuActions({ dataSource });

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

VuuTables.displaySequence = displaySequence++;

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
    useVuuMenuActions({
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

TabbedTables.displaySequence = displaySequence++;
