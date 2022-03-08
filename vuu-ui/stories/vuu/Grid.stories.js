import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Grid, GridProvider } from '@vuu-ui/data-grid';
import { ContextMenuProvider } from '@vuu-ui/ui-controls';
import { StackLayout as Stack, View, useLayoutContext } from '@vuu-ui/layout';

import { RemoteDataSource, Servers, useViewserver } from '@vuu-ui/data-remote';

import { ParsedInput, ParserProvider } from '@vuu-ui/parsed-input';
import { parseFilter, extractFilter } from '@vuu-ui/datagrid-parsers';
import createSuggestionProvider from './vuu-filter-suggestion-provider';

import '@vuu-ui/theme/index.css';
import '@vuu-ui/layout/index.css';
import '@vuu-ui/data-grid/index.css';

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  title: 'Vuu/Grid',
  component: Grid
};

const instrumentColumns = [
  { name: 'ric' },
  { name: 'description' },
  { name: 'currency' },
  { name: 'exchange' },
  { name: 'lotSize' }
];

export const VuuInstruments = () => {
  const gridRef = useRef(null);
  const [namedFilters, setNamedFilters] = useState([]);

  const onRpcResponse = useCallback((response) => {
    console.log(`handleRpcResponse ${JSON.stringify(response)}`);
  }, []);

  const dataConfig = {
    bufferSize: 100,
    columns: instrumentColumns.map((col) => col.name),
    serverName: Servers.Vuu,
    tableName: { table: 'instruments', module: 'SIMUL' },
    serverUrl: '127.0.0.1:8090/websocket'
  };

  const dataSource = useMemo(() => new RemoteDataSource(dataConfig), []);
  const { buildViewserverMenuOptions, dispatchGridAction, handleMenuAction, makeRpcCall } =
    useViewserver({
      dataSource,
      onRpcResponse
    });

  const handleCommit = (result) => {
    const { filter, name } = extractFilter(result);
    dataSource.filterQuery(filter);
    if (name) {
      setNamedFilters(namedFilters.concat({ name, filter }));
    }
  };

  const getSuggestions = useCallback(
    async (params) => {
      return await makeRpcCall({
        type: 'RPC_CALL',
        method: 'getUniqueFieldValues',
        params
      });
    },
    [makeRpcCall]
  );

  return (
    <div
      style={{
        '--hwParsedInput-border-style': 'solid solid solid none',
        '--hwParsedInput-height': '24px',
        '--hwParsedInput-input-font-size': '14px',
        width: 600,
        height: 700
      }}>
      <ParserProvider
        parser={parseFilter}
        suggestionProvider={createSuggestionProvider({
          columnNames: dataConfig.columns,
          namedFilters,
          getSuggestions,
          table: dataConfig.tableName
        })}>
        <div>
          <ParsedInput onCommit={handleCommit} />
        </div>
      </ParserProvider>

      <ContextMenuProvider
        label="App"
        menuActionHandler={handleMenuAction}
        menuBuilder={buildViewserverMenuOptions}>
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

const instrumentConfig = {
  bufferSize: 100,
  columns: instrumentColumns.map((col) => col.name),
  serverName: Servers.Vuu,
  tableName: { table: 'instruments', module: 'SIMUL' },
  serverUrl: '127.0.0.1:8090/websocket'
};

// Where would this go ?
export const useViewState = (config) => {
  const { loadSession, onConfigChange, saveSession } = useLayoutContext();

  const dataSource = useMemo(() => {
    let ds = loadSession('data-source');
    if (ds) {
      console.log('%cdatasource retrieved from session state', 'color: purple');
      return ds;
    }
    ds = new RemoteDataSource(config);
    saveSession(ds, 'data-source');
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
            column: 'currency',
            sortType: 'A'
          }
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
    serverName: Servers.Vuu,
    tableName: { table: 'instruments', module: 'SIMUL' },
    serverUrl: '127.0.0.1:8090/websocket'
  };

  const dataSource = useMemo(() => new RemoteDataSource(dataConfig), []);
  const { buildViewserverMenuOptions, dispatchGridAction, handleMenuAction } = useViewserver({
    dataSource,
    onRpcResponse
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
    <Stack showTabs style={{ width: '100%', height: 600 }} onLayoutChange={handleLayoutChange}>
      <View title="Instruments 1">
        <InstrumentGrid />
      </View>
      <View title="Instruments 2">
        <InstrumentGrid />
      </View>
    </Stack>
  );
};
