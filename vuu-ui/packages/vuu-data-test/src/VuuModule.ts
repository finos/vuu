import {
  DataSource,
  DataSourceRow,
  // DataSourceSubscribedMessage,
  OpenDialogActionWithSchema,
  SuggestionFetcher,
  TableSchema,
} from "@finos/vuu-data-types";
import {
  ClientToServerMenuRPC,
  ClientToServerViewportRpcCall,
  TypeaheadParams,
  VuuMenu,
  VuuRowDataItemType,
  VuuTable,
  VuuLink,
  LinkDescriptorWithLabel,
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
  vuuLinks?: Record<T, VuuLink[] | undefined>;
}

export type SessionTableMap = Record<string, Table>;

export type RpcServiceRequestWithParams = Omit<
  ClientToServerViewportRpcCall,
  "vpId"
> & {
  namedParams?: { [key: string]: unknown };
  selectedRows?: DataSourceRow[];
  selectedRowIds?: string[];
  table?: VuuTable;
};
export type RpcServiceRequest =
  | RpcServiceRequestWithParams
  | Omit<ClientToServerMenuRPC, "vpId">;

export const withParams = (
  rpcRequest: RpcServiceRequest
): rpcRequest is RpcServiceRequestWithParams =>
  "selectedRows" in rpcRequest || "selectedRowIds" in rpcRequest;

export const withNamedParams = (
  rpcRequest: RpcServiceRequest
): rpcRequest is RpcServiceRequestWithParams => "namedParams" in rpcRequest;

export type RpcService = {
  rpcName: string;
  service: (rpcRequest: RpcServiceRequest) => Promise<unknown>;
};

type Subscription = {
  viewportId: string;
  dataSource: DataSource;
};
export class VuuModule<T extends string = string> implements IVuuModule<T> {
  #menus: Record<T, VuuMenu | undefined> | undefined;
  #name: string;
  #schemas: Record<T, Readonly<TableSchema>>;
  #sessionTableMap: SessionTableMap = {};
  #tables: Record<T, Table>;
  #tableServices: Record<T, RpcService[] | undefined> | undefined;
  #visualLinks: Record<T, VuuLink[] | undefined> | undefined;
  #subscriptionMap: Map<string, Subscription[]> = new Map();

  constructor({
    menus,
    name,
    schemas,
    services,
    tables,
    vuuLinks: visualLinks,
  }: VuuModuleConstructorProps<T>) {
    this.#menus = menus;
    this.#name = name;
    this.#schemas = schemas;
    this.#tableServices = services;
    this.#tables = tables;
    this.#visualLinks = visualLinks;
  }

  // private registerViewport = (
  //   subscriptionDetails: DataSourceSubscribedMessage
  // ) => {
  //   console.log("<subscription-open> register new viewport", {
  //     subscriptionDetails,
  //   });
  // };

  private unregisterViewport = (viewportId: string) => {
    console.log(`<subscription-closed> unregister viewport ${viewportId}`);

    for (const subscription of this.#subscriptionMap) {
      if (subscription[1][0].viewportId.toString() === viewportId) {
        this.#subscriptionMap.delete(subscription[0]);
      } else {
        const links = subscription[1][0].dataSource.links;
        if (links) {
          for (let i = 0; i < links?.length; i++) {
            if (links[i].parentClientVpId === viewportId) {
              links.splice(i);
            }
          }
        }
        subscription[1][0].dataSource.links = links;
      }
    }
  };

  getLink = (
    subscriptionMap: Map<string, Subscription[]>,
    vuuLinks: VuuLink[]
  ) => {
    const visualLinks: LinkDescriptorWithLabel[] = [];
    for (let i = 0; i < vuuLinks.length; i++) {
      if (subscriptionMap.get(vuuLinks[i].toTable)) {
        const newLink: LinkDescriptorWithLabel = {
          parentClientVpId: subscriptionMap.get(vuuLinks[i].toTable)?.[0]
            .viewportId as string,
          parentVpId: subscriptionMap.get(vuuLinks[i].toTable)?.[0]
            .viewportId as string,
          link: vuuLinks[i],
        };
        visualLinks.push(newLink);
      }
    }
    return visualLinks;
  };

  createDataSource = (tableName: T) => {
    const visualLinks =
      this.#visualLinks?.[tableName] === undefined
        ? undefined
        : this.getLink(
            this.#subscriptionMap,
            this.#visualLinks[tableName] as VuuLink[]
          );
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
      visualLinks,
    });

    // dataSource.on("subscribed", this.registerViewport);
    dataSource.on("unsubscribed", this.unregisterViewport);

    this.#subscriptionMap.set(tableName, [
      { viewportId: dataSource.viewport, dataSource },
    ]);

    for (const key of this.#subscriptionMap.keys()) {
      if (this.#visualLinks?.[key as T] && key !== tableName) {
        const vLink = this.getLink(
          this.#subscriptionMap,
          this.#visualLinks?.[key as T] as VuuLink[]
        );
        const ds = this.#subscriptionMap.get(key)?.[0].dataSource;
        if (ds?.links) {
          ds.links = vLink;
        }
      }
    }

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

  private openBulkEdits = async (rpcRequest: RpcServiceRequest) => {
    if (withParams(rpcRequest)) {
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
    }
  };

  // Bulk-edit with input in session table
  private applyBulkEdits = async (rpcRequest: RpcServiceRequest) => {
    if (withNamedParams(rpcRequest)) {
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
    }
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

      Object.keys(this.#sessionTableMap).forEach((key) => {
        delete this.#sessionTableMap[key];
      });

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
