import {
  DataSource,
  DataSourceRow,
  DataSourceSubscribedMessage,
  OpenDialogActionWithSchema,
  SuggestionFetcher,
  TableSchema,
} from "@finos/vuu-data-types";
import {
  ClientToServerViewportRpcCall,
  LinkDescriptorWithLabel,
  TypeaheadParams,
  VuuMenu,
  VuuRowDataItemType,
  VuuTable,
} from "@finos/vuu-protocol-types";
import { uuid } from "@finos/vuu-utils";
import { Table, buildDataColumnMapFromSchema } from "./Table";
import { TickingArrayDataSource } from "./TickingArrayDataSource";
import { makeSuggestions } from "./makeSuggestions";

export interface IVuuModule<T extends string = string> {
  createDataSource: (tableName: T) => DataSource;
  typeaheadHook: () => SuggestionFetcher;
}

export interface VuuModuleConstructorProps<T extends string = string> {
  menus?: Record<T, VuuMenu | undefined>;
  name: string;
  schemas: Record<T, Readonly<TableSchema>>;
  services?: Record<T, RpcService[] | undefined>;
  tables: Record<T, Table>;
  visualLinks?: Record<T, LinkDescriptorWithLabel[] | undefined>;
}

export type SessionTableMap = Record<string, Table>;

export type RpcService = {
  rpcName: string;
  service: (
    rpcRequest: Omit<ClientToServerViewportRpcCall, "vpId"> & {
      namedParams?: { [key: string]: unknown };
      selectedRows?: DataSourceRow[];
      selectedRowIds?: string[];
      table?: VuuTable;
    }
  ) => Promise<unknown>;
};

export class VuuModule<T extends string = string> implements IVuuModule<T> {
  #menus: Record<T, VuuMenu | undefined> | undefined;
  #name: string;
  #schemas: Record<T, Readonly<TableSchema>>;
  #sessionTableMap: SessionTableMap = {};
  #tables: Record<T, Table>;
  #tableServices: Record<T, RpcService[] | undefined> | undefined;
  #visualLinks: Record<T, LinkDescriptorWithLabel[] | undefined> | undefined;

  constructor({
    menus,
    name,
    schemas,
    services,
    tables,
    visualLinks,
  }: VuuModuleConstructorProps<T>) {
    this.#menus = menus;
    this.#name = name;
    this.#schemas = schemas;
    this.#tableServices = services;
    this.#tables = tables;
    this.#visualLinks = visualLinks;
  }

  private registerViewport = (
    subscriptionDetails: DataSourceSubscribedMessage
  ) => {
    console.log("<subscription-open> register new viewport", {
      subscriptionDetails,
    });
  };

  private unregisterViewport = (viewportId: string) => {
    console.log(`<subscription-closed> unregister viewport ${viewportId}`);
  };

  createDataSource = (tableName: T) => {
    const columnDescriptors = this.getColumnDescriptors(tableName);
    const dataSource = new TickingArrayDataSource({
      columnDescriptors,
      keyColumn:
        this.#schemas[tableName] === undefined
          ? this.#sessionTableMap[tableName].schema.key
          : this.#schemas[tableName].key,
      table: this.#tables[tableName] || this.#sessionTableMap[tableName],
      menu: this.#menus?.[tableName],
      rpcServices: this.getServices(tableName),
      sessionTables: this.#sessionTableMap,
      visualLinks: this.#visualLinks?.[tableName],
    });

    dataSource.on("subscribed", this.registerViewport);
    dataSource.on("unsubscribed", this.unregisterViewport);

    return dataSource;
  };

  getServices(tableName: T) {
    const tableServices = this.#tableServices?.[tableName];
    if (Array.isArray(tableServices)) {
      return this.#moduleServices.concat(tableServices);
    } else {
      return this.#moduleServices;
    }
  }

  get typeaheadHook() {
    return () => this.suggestionFetcher;
  }

  private getSessionTable() {
    if (Object.keys(this.#sessionTableMap).length === 1) {
      const [sessionTable] = Object.values(this.#sessionTableMap);
      return sessionTable;
    } else {
      throw Error(
        "getSessionTable: should never be more than one session table in map"
      );
    }
  }

  private getColumnDescriptors(tableName: T) {
    const schema = this.#schemas[tableName] || this.getSessionTable()?.schema;
    if (schema) {
      return schema.columns;
    } else {
      throw Error(
        ` no schema found for module ${this.#name} table ${tableName}`
      );
    }
  }

  private suggestionFetcher: SuggestionFetcher = ([
    vuuTable,
    column,
    pattern,
  ]: TypeaheadParams) => {
    const table = this.#tables[vuuTable.table as T];
    if (table) {
      return makeSuggestions(table, column, pattern);
    } else {
      throw Error(
        `${this.#name} suggestionFetcher, unknown table ${vuuTable.module} ${
          vuuTable.table
        }`
      );
    }
  };

  private openBulkEdits = async (
    rpcRequest: Omit<ClientToServerViewportRpcCall, "vpId"> & {
      selectedRowIds?: string[];
      table?: VuuTable;
    }
  ) => {
    const { selectedRowIds, table } = rpcRequest;
    if (selectedRowIds && table) {
      const dataTable = this.#tables[table.table as T];
      if (dataTable) {
        const sessionTable = this.createSessionTableFromSelectedRows(
          dataTable,
          selectedRowIds
        );
        const sessionTableName = `${table.table}-${uuid()}`;
        this.#sessionTableMap[sessionTableName] = sessionTable;

        return {
          action: {
            renderComponent: "grid",
            table: {
              module: "SIMUL",
              table: sessionTableName,
            },
            tableSchema: dataTable.schema,
            type: "OPEN_DIALOG_ACTION",
          } as OpenDialogActionWithSchema,
          requestId: "request_id",
          rpcName: "VP_BULK_EDIT_BEGIN_RPC",
        };
      } else {
        return {
          requestId: "request_id",
          rpcName: "VP_BULK_EDIT_REJECT",
        };
      }
    }
  };

  // Bulk-edit with input in session table
  private applyBulkEdits = async (
    rpcRequest: Omit<ClientToServerViewportRpcCall, "vpId"> & {
      namedParams: { [key: string]: unknown };
      table?: VuuTable;
    }
  ) => {
    const sessionTable = this.getSessionTable();
    for (let i = 0; i < sessionTable.data.length; i++) {
      const newRow = sessionTable.data[i];
      const { column, value } = rpcRequest.namedParams;
      const keyIndex = sessionTable.map[sessionTable.schema.key];
      sessionTable.update(String(newRow[keyIndex]), column as string, value);
    }
    return {
      action: {
        type: "NO_ACTION",
      },
      requestId: "request_id",
      rpcName: "VP_BULK_EDIT_COLUMN_CELLS_RPC",
    };
  };

  // Save session table data to main table
  private saveBulkEdits = async () => {
    const sessionTable = this.getSessionTable();
    const { table } = sessionTable.schema.table;
    const baseTable = this.#tables[table as T];
    if (baseTable) {
      for (let i = 0; i < sessionTable.data.length; i++) {
        const newRow = sessionTable.data[i];
        baseTable.updateRow(newRow);
      }
      return {
        action: {
          type: "NO_ACTION",
        },
        requestId: "request_id",
        rpcName: "VP_BULK_EDIT_SUBMIT_RPC",
      };
    }
  };

  private createSessionTableFromSelectedRows(
    { data, map, schema }: Table,
    selectedRowIds: string[]
  ) {
    const keyIndex = map[schema.key];
    const sessionData: VuuRowDataItemType[][] = [];
    for (let i = 0; i < selectedRowIds.length; i++) {
      for (let j = 0; j < data.length; j++) {
        if (data[j][keyIndex] === selectedRowIds[i]) {
          sessionData.push(data[j]);
        }
      }
    }
    return new Table(schema, sessionData, buildDataColumnMapFromSchema(schema));
  }

  /**
   * These services are available on any table. The client must configure the appropriate
   * menu item(s) on Table(s). The services to implement these RPC calls are built-in to
   * VuuModule
   */
  #moduleServices: RpcService[] = [
    {
      rpcName: "VP_BULK_EDIT_BEGIN_RPC",
      service: this.openBulkEdits,
    },
    {
      rpcName: "VP_BULK_EDIT_COLUMN_CELLS_RPC",
      service: this.applyBulkEdits,
    },
    {
      rpcName: "VP_BULK_EDIT_SUBMIT_RPC",
      service: this.saveBulkEdits,
    },
  ];
}
