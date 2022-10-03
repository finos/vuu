import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SimpleStore } from '@vuu-ui/utils';
import { useServerConnection } from './useServerConnection';
import { columnMetaData as columnConfig } from './columnMetaData';
import { DataSource } from '../data-source';
import { ClientToServerRpcCall, VuuMenuItem } from '@vuu-ui/data-types';

export const addRowsFromInstruments = 'addRowsFromInstruments';
export const RpcCall = 'RPC_CALL';

const tableStore = new SimpleStore({});

const contextSortPriorities = {
  'selected-rows': 0,
  cell: 1,
  row: 2,
  grid: 3
};

const byContext = (menu1: VuuMenuItem, menu2: VuuMenuItem) => {
  return contextSortPriorities[menu1.context] - contextSortPriorities[menu2.context];
};

const contextCompatibleWithLocation = (location, context, selectedRowCount) => {
  switch (location) {
    case 'grid':
      if (context === 'selected-rows') {
        return selectedRowCount > 0;
      } else {
        return true;
      }
    case 'header':
      return context === 'grid';
    default:
      return false;
  }
};

const extendSchema = ({ columns, dataTypes, table }) => {
  return {
    table,
    columns: columns.map((col, idx) =>
      columnConfig[col]
        ? { ...columnConfig[col], serverDataType: dataTypes[idx] }
        : { name: col, serverDataType: dataTypes[idx] }
    )
  };
};

export interface ViewServerHookProps {
  loadSession?: () => any;
  onConfigChange?: () => void;
  onRpcResponse?: () => void;
  rpcServer?: DataSource;
  saveSession?: () => void;
}

// Either a DataSource or a Connection is acceptable as rpcServer, both support the rpc interface
export const useViewserver = ({
  loadSession,
  onConfigChange,
  onRpcResponse,
  rpcServer,
  saveSession
}: ViewServerHookProps = {}) => {
  const [tables, setTables] = useState(tableStore.value);

  // IF we're passed in an rpcServer, whether its a dataSource or connection,
  // why do we need to get server here ?
  const server = useServerConnection(undefined);
  const contextMenuOptions = useMemo(
    () => loadSession?.('vs-context-menu') ?? undefined,
    [loadSession]
  );
  const contextMenu = useRef(contextMenuOptions);
  const visualLinks = useRef();

  const buildTables = useCallback((schemas) => {
    const newTables = {};
    schemas.forEach((schema) => {
      newTables[schema.table.table] = extendSchema(schema);
    });
    tableStore.value = newTables;
  }, []);

  useEffect(() => {
    tableStore.on('loaded', (_, tables) => {
      setTables(tables);
    });
  }, []);

  const makeRpcCall = useCallback(
    async (rpcRequest: Omit<ClientToServerRpcCall, 'service'>) => {
      const response = await server.rpcCall(rpcRequest);
      switch (response.method) {
        case addRowsFromInstruments:
          onRpcResponse?.('showOrderEntry');
          break;
        default:
          return response.result;
      }
    },
    [onRpcResponse, server]
  );

  const buildViewserverMenuOptions = useCallback((location, options) => {
    const { selectedRowCount = 0 } = options;
    const descriptors = [];

    if (visualLinks.current) {
      visualLinks.current.forEach((linkDescriptor) => {
        descriptors.push({
          label: `Link to ${linkDescriptor.link.toTable}`,
          action: 'link-table',
          options: linkDescriptor
        });
      });
    }

    if (contextMenu.current) {
      contextMenu.current.menus.sort(byContext).forEach(({ name, filter, rpcName, context }) => {
        if (contextCompatibleWithLocation(location, context, selectedRowCount)) {
          descriptors.push({
            label: name,
            action: 'MENU_RPC_CALL',
            options: {
              context,
              filter,
              rpcName
            }
          });
        }
      });
    }

    return descriptors;
  }, []);

  const dispatchGridAction = useCallback(
    (action) => {
      if (action.type === 'VIEW_PORT_MENUS_RESP') {
        contextMenu.current = action.menu;
        saveSession?.(action.menu, 'vs-context-menu');
        return true;
      } else if (action.type === 'VP_VISUAL_LINKS_RESP') {
        visualLinks.current = action.links;
        return true;
      } else if (action.type === 'visual-link-created') {
        onConfigChange?.(action);
      } else {
        console.log(`useViewserver dispatchGridAction no handler for ${action.type}`);
      }
    },
    [onConfigChange, saveSession]
  );

  const handleMenuAction = useCallback(
    (type, options) => {
      if (type === 'MENU_RPC_CALL') {
        rpcServer.rpcCall({ type, ...options }).then((result) => {
          onRpcResponse && onRpcResponse(result);
        });
        return true;
      } else if (type === 'link-table') {
        // the createLink method only exists on dataSource
        return rpcServer.createLink(options), true;
      } else {
        console.log(`useViewServer handleMenuAction,  can't handle ${type}`);
      }
    },
    [rpcServer, onRpcResponse]
  );

  useEffect(() => {
    async function fetchTableMetadata() {
      tableStore.status = 'loading';
      const { tables } = await server.getTableList();
      buildTables(
        await Promise.all(tables.map((tableDescriptor) => server.getTableMeta(tableDescriptor)))
      );
    }

    if (server && tableStore.status === '') {
      fetchTableMetadata();
    }
  }, [buildTables, server, setTables]);

  return {
    buildViewserverMenuOptions,
    dispatchGridAction,
    handleMenuAction,
    tables,
    makeRpcCall
  };
};
