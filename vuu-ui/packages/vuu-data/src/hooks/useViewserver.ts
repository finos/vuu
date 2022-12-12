//TODO split this hook into functionality which is specific to a View instance and functionality which isn't
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SimpleStore } from "@vuu-ui/vuu-utils";
import { useServerConnection } from "./useServerConnection";
import { getColumnConfig } from "./columnMetaData";
import {
  ConfigChangeHandler,
  DataSource,
  DataSourceMenusMessage,
  DataSourceVisualLinkCreatedMessage,
  DataSourceVisualLinksMessage,
} from "../data-source";
import {
  ClientToServerRpcCall,
  ColumnDataType,
  TypeAheadMethod,
  TypeaheadParams,
  VuuMenuContext,
  VuuMenuItem,
  VuuTable,
} from "../../../vuu-protocol-types";
import { RpcResponse, TableMeta } from "../vuuUIMessageTypes";
import { AnyTxtRecord } from "dns";
import { ContextMenuLocation } from "@vuu-ui/vuu-datagrid/src/context-menu";
import { useViewContext } from "@vuu-ui/vuu-layout";
import { LinkWithLabel } from "../server-proxy/server-proxy";

export const addRowsFromInstruments = "addRowsFromInstruments";
export const RpcCall = "RPC_CALL";

export type SchemaColumn = {
  name: string;
  serverDataType: ColumnDataType;
  label?: string;
  type?: { name: string };
  width?: number;
};

export type SuggestionFetcher = (params: TypeaheadParams) => Promise<string[]>;

// const SPECIAL_SPACE = "\u00A0";
const SPECIAL_SPACE = "_";

export type TableSchema = {
  columns: SchemaColumn[];
  table: VuuTable;
};

export type VuuTableSchemas = { [key: string]: TableSchema };

const tableStore = new SimpleStore<{ [key: string]: TableSchema }>({});

const contextSortPriorities = {
  "selected-rows": 0,
  cell: 1,
  row: 2,
  grid: 3,
};

const byContext = (menu1: VuuMenuItem, menu2: VuuMenuItem) => {
  return (
    contextSortPriorities[menu1.context] - contextSortPriorities[menu2.context]
  );
};

const containSpace = (text: string) => text.indexOf(" ") !== -1;
const replaceSpace = (text: string) => text.replace(/\s/g, SPECIAL_SPACE);

const contextCompatibleWithLocation = (
  location: ContextMenuLocation,
  context: VuuMenuContext,
  selectedRowCount: number
) => {
  switch (location) {
    case "grid":
      if (context === "selected-rows") {
        return selectedRowCount > 0;
      } else {
        return true;
      }
    case "header":
      return context === "grid";
    default:
      return false;
  }
};

const createSchemaFromTableMetadata = ({
  columns,
  dataTypes,
  table,
}: TableMeta): TableSchema => {
  return {
    table,
    columns: columns.map((col, idx) => {
      const columnConfig = getColumnConfig(table.table, col);
      return columnConfig
        ? { ...columnConfig, serverDataType: dataTypes[idx] }
        : { name: col, serverDataType: dataTypes[idx] };
    }),
  };
};

export interface ViewServerHookResult {
  buildViewserverMenuOptions: any;
  dispatchGridAction: any;
  getTypeaheadSuggestions: any;
  handleMenuAction: AnyTxtRecord;
  tables: VuuTableSchemas;
  makeRpcCall: any;
}

export interface ViewServerHookProps {
  onConfigChange?: ConfigChangeHandler;
  onRpcResponse?: (response: RpcResponse) => void;
  rpcServer?: DataSource;
}

// Either a DataSource or a Connection is acceptable as rpcServer, both support the rpc interface
export const useViewserver = ({
  onConfigChange,
  onRpcResponse,
  rpcServer,
}: ViewServerHookProps = {}): ViewServerHookResult => {
  const [tables, setTables] = useState(tableStore.value);
  const { load, loadSession, saveSession } = useViewContext();

  // IF we're passed in an rpcServer, whether its a dataSource or connection,
  // why do we need to get server here ?
  const server = useServerConnection(undefined);
  console.log(`useViewserver server`, {
    server,
  });
  const contextMenuOptions = useMemo(
    () => loadSession?.("vs-context-menu") ?? undefined,
    [loadSession]
  );
  const contextMenu = useRef(contextMenuOptions);

  const buildTables = useCallback((schemas: TableMeta[]) => {
    const newTables: { [key: string]: TableSchema } = {};
    schemas.forEach((schema) => {
      newTables[schema.table.table] = createSchemaFromTableMetadata(schema);
    });
    tableStore.value = newTables;
  }, []);

  useEffect(() => {
    tableStore.on("loaded", (_, tables) => {
      setTables(tables);
    });
  }, []);

  const makeRpcCall = useCallback(
    async (rpcRequest: Omit<ClientToServerRpcCall, "service">) => {
      if (server) {
        const response = await server.rpcCall(rpcRequest);
        switch (response.method) {
          case addRowsFromInstruments:
            onRpcResponse?.("showOrderEntry");
            break;
          default:
            return response.result;
        }
      } else {
        throw Error("Server not ready");
      }
    },
    [onRpcResponse, server]
  );

  const getTypeaheadSuggestions: SuggestionFetcher = useCallback(
    async (params: TypeaheadParams) => {
      const method: TypeAheadMethod =
        params.length === 2
          ? "getUniqueFieldValues"
          : "getUniqueFieldValuesStartingWith";

      const suggestions = await makeRpcCall({
        type: "RPC_CALL",
        method,
        params,
      });

      return suggestions.some(containSpace)
        ? suggestions.map(replaceSpace)
        : suggestions;
    },
    [makeRpcCall]
  );

  const buildViewserverMenuOptions = useCallback(
    (location, options) => {
      const { selectedRowCount = 0 } = options;
      const descriptors = [];

      const visualLinks = loadSession?.("visual-links");
      const visualLink = load?.("visual-link");
      if (visualLinks && !visualLink) {
        visualLinks.forEach((linkDescriptor: LinkWithLabel) => {
          const { link, label: linkLabel } = linkDescriptor;
          const label = linkLabel ? linkLabel : link.toTable;
          descriptors.push({
            label: `Link to ${label}`,
            action: "link-table",
            options: linkDescriptor,
          });
        });
      }

      if (contextMenu.current) {
        contextMenu.current.menus
          .sort(byContext)
          .forEach(({ name, filter, rpcName, context }) => {
            if (
              contextCompatibleWithLocation(location, context, selectedRowCount)
            ) {
              descriptors.push({
                label: name,
                action: "MENU_RPC_CALL",
                options: {
                  context,
                  filter,
                  rpcName,
                },
              });
            }
          });
      }

      return descriptors;
    },
    [loadSession]
  );

  const dispatchGridAction = useCallback(
    (
      action:
        | DataSourceVisualLinkCreatedMessage
        | DataSourceMenusMessage
        | DataSourceVisualLinksMessage
    ) => {
      if (action.type === "VIEW_PORT_MENUS_RESP") {
        contextMenu.current = action.menu;
        saveSession?.(action.menu, "vs-context-menu");
        return true;
      } else if (action.type === "VP_VISUAL_LINKS_RESP") {
        saveSession?.(action.links, "visual-links");
        return true;
      } else if (
        action.type === "CREATE_VISUAL_LINK_SUCCESS" ||
        action.type === "REMOVE_VISUAL_LINK_SUCCESS"
      ) {
        onConfigChange?.(action);
      } else {
        console.log(`useViewserver dispatchGridAction no handler for action`);
      }
    },
    [onConfigChange, saveSession]
  );

  const handleMenuAction = useCallback(
    (type, options) => {
      if (type === "MENU_RPC_CALL") {
        rpcServer.rpcCall({ type, ...options }).then((result) => {
          onRpcResponse && onRpcResponse(result);
        });
        return true;
      } else if (type === "link-table") {
        // the createLink method only exists on dataSource
        return rpcServer.createLink(options), true;
      } else {
        console.log(
          `useViewServer handleMenuAction,  can't handle action type`
        );
      }
    },
    [rpcServer, onRpcResponse]
  );

  useEffect(() => {
    async function fetchTableMetadata() {
      tableStore.status = "loading";
      if (server) {
        const { tables } = await server.getTableList();
        buildTables(
          await Promise.all(
            tables.map((tableDescriptor) =>
              server.getTableMeta(tableDescriptor)
            )
          )
        );
      }
    }

    if (server && tableStore.status === "") {
      fetchTableMetadata();
    }
  }, [buildTables, server, setTables]);

  return {
    buildViewserverMenuOptions,
    dispatchGridAction,
    getTypeaheadSuggestions,
    handleMenuAction,
    tables,
    makeRpcCall,
  };
};
