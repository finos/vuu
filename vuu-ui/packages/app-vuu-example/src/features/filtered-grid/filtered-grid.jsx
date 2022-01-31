import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLayoutContext } from '@vuu-ui/layout';
import { ParsedInput, ParserProvider } from '@vuu-ui/parsed-input';
import { parseFilter, extractFilter, filterAsQuery } from '@vuu-ui/datagrid-parsers';
import createSuggestionProvider from './vuu-filter-suggestion-provider';

import { Button, ContextMenuProvider, Link as LinkIcon } from '@vuu-ui/ui-controls';
import { Grid, GridProvider } from '@vuu-ui/data-grid';
import { createDataSource, useViewserver } from '@vuu-ui/data-remote';
import AppContext from '../../app-context';

import '@vuu-ui/parsed-input/index.css';
import './filtered-grid.css';

const FilteredGrid = ({ onServiceRequest, schema, ...props }) => {
  const { id, dispatch, load, save, loadSession, saveSession } = useLayoutContext();
  const config = useMemo(() => load(), [load]);
  const { handleRpcResponse } = useContext(AppContext);
  const [namedFilters, setNamedFilters] = useState([]);

  const dataSource = useMemo(() => {
    let ds = loadSession('data-source');
    if (ds) {
      return ds;
    }
    ds = createDataSource({ id, tableName: schema.table, schema, config });
    saveSession(ds, 'data-source');
    return ds;
  }, [config, id, loadSession, saveSession, schema]);

  useEffect(() => {
    dataSource.enable();
    return () => {
      dataSource.disable();
    };
  }, [dataSource]);

  const unlink = () => {
    console.log('unlink');
  };

  const handleConfigChange = useCallback(
    (update) => {
      if (update.type === 'visual-link-created') {
        dispatch({
          type: 'toolbar-contribution',
          location: 'post-title',
          content: (
            <Button aria-label="remove-link" onClick={unlink}>
              <LinkIcon />
            </Button>
          )
        });
        save(update, 'visual-link');
        dispatch({ type: 'save' });
      } else {
        for (let [key, state] of Object.entries(update)) {
          save(state, key);
        }
      }
    },
    [dispatch, save]
  );

  const { buildViewserverMenuOptions, dispatchGridAction, handleMenuAction, makeRpcCall } =
    useViewserver({
      loadSession,
      rpcServer: dataSource,
      onConfigChange: handleConfigChange,
      onRpcResponse: handleRpcResponse,
      saveSession
    });

  const handleCommit = useCallback(
    (result) => {
      const { filter, name } = extractFilter(result);
      const filterQuery = filterAsQuery(filter, namedFilters);
      dataSource.filter(filter, filterQuery);
      if (name) {
        setNamedFilters(namedFilters.concat({ name, filter }));
      }
    },
    [dataSource, namedFilters]
  );

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
    <ContextMenuProvider
      menuActionHandler={handleMenuAction}
      menuBuilder={buildViewserverMenuOptions}>
      <ParserProvider
        parser={parseFilter}
        suggestionProvider={createSuggestionProvider({
          columnNames: dataSource.columns,
          namedFilters,
          getSuggestions,
          table: dataSource.tableName
        })}>
        <Button className="vuFilterButton" data-icon="filter" />

        <ParsedInput onCommit={handleCommit} />
      </ParserProvider>

      <GridProvider value={{ dispatchGridAction }}>
        <Grid
          {...props}
          columnSizing="fill"
          dataSource={dataSource}
          aggregations={config?.aggregations}
          columns={config?.columns || schema.columns}
          groupBy={config?.group}
          onConfigChange={handleConfigChange}
          renderBufferSize={80}
          rowHeight={18}
          selectionModel="extended"
          sort={config?.sort}
          showLineNumbers
        />
      </GridProvider>
    </ContextMenuProvider>
  );
};

FilteredGrid.displayName = 'FilteredGrid';

export default FilteredGrid;
