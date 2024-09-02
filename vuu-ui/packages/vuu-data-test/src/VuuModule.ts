import {
  DataSource,
  OpenDialogActionWithSchema,
  SuggestionFetcher,
  TableSchema
} from "@finos/vuu-data-types";
import {
  VuuRpcMenuRequest,
  VuuRpcViewportRequest,
  TypeaheadParams,
  VuuMenu,
  VuuRowDataItemType,
  VuuTable,
  VuuLink,
  LinkDescriptorWithLabel,
  RpcNamedParams,
  VuuRpcRequest,
  VuuRpcResponse,
  VuuRpcMenuResponse,
  VuuRpcViewportResponse
} from "@finos/vuu-protocol-types";
import { isViewportRpcRequest, uuid } from "@finos/vuu-utils";
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

export type RpcServiceRequestWithParams = VuuRpcViewportRequest & {
  namedParams: RpcNamedParams;
};
export type RpcServiceRequest =
  | RpcServiceRequestWithParams
  | VuuRpcViewportRequest
  | VuuRpcMenuRequest;

export const withParams = (
  rpcRequest: VuuRpcRequest
): rpcRequest is RpcServiceRequestWithParams => "namedParams" in rpcRequest;

export const withNamedParams = (
  rpcRequest: RpcServiceRequest
): rpcRequest is RpcServiceRequestWithParams => "namedParams" in rpcRequest;

export type ServiceHandler = (
  rpcRequest: VuuRpcRequest & {
    namedParams?: RpcNamedParams;
  }
) => Promise<VuuRpcResponse>;

export type RpcService = {
  rpcName: string;
  service: ServiceHandler;
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
    vuuLinks: visualLinks
  }: VuuModuleConstructorProps<T>) {
    this.#menus = menus;
    this.#name = name;
    this.#schemas = schemas;
    this.#tableServices = services;
    this.#tables = tables;
    this.#visualLinks = visualLinks;
  }

  private unregisterViewport = (viewportId: string) => {
    console.log(`<subscription-closed> unregister viewport ${viewportId}`);

    for (const [tableName, subscriptions] of this.#subscriptionMap) {
      if (subscriptions[0].viewportId.toString() === viewportId) {
        this.#subscriptionMap.delete(tableName);
      } else {
        const links = subscriptions[0].dataSource.links;
        if (links) {
          for (let i = 0; i < links?.length; i++) {
            if (links[i].parentClientVpId === viewportId) {
              links.splice(i);
            }
          }
        }
        subscriptions[0].dataSource.links = links;
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
          link: vuuLinks[i]
        };
        visualLinks.push(newLink);
      }
    }
    return visualLinks;
  };

  createDataSource = (tableName: T, viewport?: string) => {
    const visualLinks =
      this.#visualLinks?.[tableName] === undefined
        ? undefined
        : this.getLink(
            this.#subscriptionMap,
            this.#visualLinks[tableName] as VuuLink[]
          );
    const columnDescriptors = this.getColumnDescriptors(tableName);
    const table = this.#tables[tableName];
    const sessionTable = this.#sessionTableMap[tableName];

    const dataSource: DataSource = new TickingArrayDataSource({
      columnDescriptors,
      keyColumn:
        this.#schemas[tableName] === undefined
          ? this.#sessionTableMap[tableName].schema.key
          : this.#schemas[tableName].key,
      table: table || sessionTable,
      menu: this.#menus?.[tableName],
      rpcServices: this.getServices(tableName),
      sessionTables: this.#sessionTableMap,
      viewport,
      visualLinks
    });

    dataSource.on("unsubscribed", this.unregisterViewport);

    this.#subscriptionMap.set(tableName, [
      { viewportId: dataSource.viewport as string, dataSource }
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

  protected get sessionTableMap() {
    return this.#sessionTableMap;
  }

  protected get tables() {
    return this.#tables;
  }

  private getSessionTable(sessionTableName: string) {
    const sessionTable = this.#sessionTableMap[sessionTableName];
    if (sessionTable) {
      return sessionTable;
    } else {
      throw Error(
        `getSessionTable: no session table with name ${sessionTableName}`
      );
    }
  }

  private getColumnDescriptors(tableName: T) {
    const schema =
      this.#schemas[tableName] || this.getSessionTable(tableName)?.schema;
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
    pattern
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

  private openBulkEdits: ServiceHandler = async (rpcRequest) => {
    if (withParams(rpcRequest)) {
      const { namedParams, vpId } = rpcRequest;
      const selectedRowIds = namedParams.selectedRowIds as string[];
      const table = namedParams.table as VuuTable;

      if (selectedRowIds && table) {
        const dataTable = this.#tables[table.table as T];
        if (dataTable) {
          const sessionTable = this.createSessionTableFromSelectedRows(
            dataTable,
            selectedRowIds
          );
          const sessionTableName = `session-${uuid()}`;
          this.#sessionTableMap[sessionTableName] = sessionTable;

          return {
            action: {
              renderComponent: "grid",
              table: {
                module: table.module,
                table: sessionTableName
              },
              tableSchema: dataTable.schema,
              type: "OPEN_DIALOG_ACTION"
            } as OpenDialogActionWithSchema,
            rpcName: "VP_BULK_EDIT_BEGIN_RPC",
            type: "VIEW_PORT_MENU_RESP",
            vpId
          } as VuuRpcMenuResponse;
        } else {
          return {
            action: { type: "NO_ACTION" },
            clientViewportId: "na",
            error: "No Table found",
            rpcName: "VP_BULK_EDIT_REJECT",
            type: "VIEW_PORT_MENU_REJ",
            vpId
          } as VuuRpcMenuResponse;
        }
      }
    }
    throw Error("openBulkEdits expects Table and selectedRowIds");
  };

  private endEditSession: ServiceHandler = async (rpcRequest) => {
    if (isViewportRpcRequest(rpcRequest)) {
      const { vpId } = rpcRequest;
      delete this.#sessionTableMap[vpId];
      return {
        action: { type: "VP_RPC_SUCCESS" },
        namedParams: {},
        params: [],
        type: "VIEW_PORT_RPC_REPONSE",
        vpId
      } as VuuRpcViewportResponse;
    } else {
      throw Error("endEditSession invalid request");
    }
  };

  // Bulk-edit with input in session table
  private applyBulkEdits: ServiceHandler = async (rpcRequest) => {
    if (withParams(rpcRequest)) {
      const { vpId } = rpcRequest;
      const sessionTable = this.getSessionTable(vpId);
      for (let i = 0; i < sessionTable.data.length; i++) {
        const newRow = sessionTable.data[i];
        const { column, value } = rpcRequest.namedParams;
        const keyIndex = sessionTable.map[sessionTable.schema.key];
        sessionTable.update(
          String(newRow[keyIndex]),
          column as string,
          value as VuuRowDataItemType
        );
      }
      return {
        action: {
          type: "NO_ACTION"
        },
        rpcName: "VP_BULK_EDIT_COLUMN_CELLS_RPC",
        type: "VIEW_PORT_MENU_RESP",
        vpId
      } as VuuRpcMenuResponse;
    }
    throw Error("applyBulkEdits expects column and value as namedParams");
  };

  // Save session table data to main table
  private saveBulkEdits: ServiceHandler = async (rpcRequest) => {
    if (withParams(rpcRequest)) {
      const { vpId } = rpcRequest;
      const sessionTable = this.getSessionTable(vpId);
      const { table } = sessionTable.schema.table;
      const baseTable = this.#tables[table as T];
      if (baseTable) {
        for (let i = 0; i < sessionTable.data.length; i++) {
          const newRow = sessionTable.data[i];
          baseTable.updateRow(newRow);
        }

        return {
          action: {
            type: "NO_ACTION"
          },
          requestId: "request_id",
          rpcName: "VP_BULK_EDIT_SUBMIT_RPC",
          type: "VIEW_PORT_MENU_RESP",
          vpId
        } as VuuRpcMenuResponse;
      }
    }
    throw Error("saveBulkEdits base table not found");
  };

  protected createSessionTableFromSelectedRows(
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
      service: this.openBulkEdits
    },
    {
      rpcName: "VP_BULK_EDIT_COLUMN_CELLS_RPC",
      service: this.applyBulkEdits
    },
    {
      rpcName: "VP_BULK_EDIT_SUBMIT_RPC",
      service: this.saveBulkEdits
    },
    {
      rpcName: "VP_BULK_EDIT_END_RPC",
      service: this.endEditSession
    }
  ];
}
