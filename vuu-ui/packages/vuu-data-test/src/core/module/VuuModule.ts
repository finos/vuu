import {
  DataSource,
  DataSourceConfig,
  DataSourceVisualLinkCreatedMessage,
  OpenDialogActionWithSchema,
  TableSchema,
} from "@vuu-ui/vuu-data-types";
import {
  VuuRpcMenuRequest,
  VuuRpcViewportRequest,
  VuuMenu,
  VuuRowDataItemType,
  VuuTable,
  VuuLink,
  LinkDescriptorWithLabel,
  RpcNamedParams,
  VuuRpcRequest,
  VuuRpcResponse,
  VuuRpcMenuResponse,
  VuuRpcViewportResponse,
  VuuCreateVisualLink,
  VuuRemoveVisualLink,
} from "@vuu-ui/vuu-protocol-types";
import { isViewportRpcRequest, uuid } from "@vuu-ui/vuu-utils";
import { Table, buildDataColumnMapFromSchema } from "../../Table";
import { TickingArrayDataSource } from "../../TickingArrayDataSource";
import { RuntimeVisualLink } from "../../RuntimeVisualLink";
import moduleContainer from "./ModuleContainer";

export interface IVuuModule<T extends string = string> {
  createDataSource: (tableName: T) => DataSource;
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
  rpcRequest: VuuRpcRequest,
): rpcRequest is RpcServiceRequestWithParams => "namedParams" in rpcRequest;

export const withNamedParams = (
  rpcRequest: RpcServiceRequest,
): rpcRequest is RpcServiceRequestWithParams => "namedParams" in rpcRequest;

export type ServiceHandler = (
  rpcRequest: VuuRpcRequest & {
    namedParams?: RpcNamedParams;
  },
) => Promise<VuuRpcResponse>;

export type RpcService = {
  rpcName: string;
  service: ServiceHandler;
};

type Subscription = {
  viewportId: string;
  dataSource: DataSource;
};
export abstract class VuuModule<T extends string = string>
  implements IVuuModule<T>
{
  #name: string;
  #runtimeVisualLinks = new Map<string, RuntimeVisualLink>();
  #sessionTableMap: SessionTableMap = {};
  #tableServices: Record<T, RpcService[] | undefined> | undefined;
  #subscriptionMap: Map<string, Subscription[]> = new Map();

  constructor(name: string) {
    this.#name = name;
    moduleContainer.register(this);
  }

  protected abstract menus?: Record<T, VuuMenu | undefined> | undefined;
  protected abstract schemas: Record<T, Readonly<TableSchema>>;
  protected abstract tables: Record<T, Table>;
  protected abstract services?: Record<T, RpcService[] | undefined> | undefined;
  protected abstract visualLinks?: Record<T, VuuLink[] | undefined>;

  getTableSchema(tableName: string) {
    return this.schemas[tableName as T];
  }

  getTableList() {
    return Object.keys(this.tables);
  }

  private unregisterViewport = (viewportId: string) => {
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

  get name() {
    return this.#name;
  }

  getSubscribedDataSource(vpId: string): DataSource {
    for (const subscriptions of this.#subscriptionMap.values()) {
      for (const { viewportId, dataSource } of subscriptions) {
        if (viewportId === vpId) {
          return dataSource;
        }
      }
    }
    throw Error(`getSubscribedDataSource #${vpId} not in subscriptionMap`);
  }

  getLinks = (
    subscriptionMap: Map<string, Subscription[]>,
    vuuLinks: VuuLink[],
  ) => {
    const visualLinks: LinkDescriptorWithLabel[] = [];
    for (let i = 0; i < vuuLinks.length; i++) {
      const subscriptions = subscriptionMap.get(vuuLinks[i].toTable);
      if (subscriptions) {
        subscriptions.forEach(({ viewportId, dataSource: { status } }) => {
          if (status !== "suspended") {
            const newLink: LinkDescriptorWithLabel = {
              parentClientVpId: viewportId,
              parentVpId: viewportId,
              link: vuuLinks[i],
            };
            visualLinks.push(newLink);
          }
        });
      }
    }
    return visualLinks;
  };

  visualLinkService = (
    message: VuuCreateVisualLink | VuuRemoveVisualLink,
  ): Promise<DataSourceVisualLinkCreatedMessage | void> =>
    new Promise((resolve) => {
      if (message.type === "CREATE_VISUAL_LINK") {
        const { childColumnName, childVpId, parentColumnName, parentVpId } =
          message;
        const childDataSource = this.getSubscribedDataSource(childVpId);
        const parentDataSource = this.getSubscribedDataSource(parentVpId);
        const runtimeVisualLink = new RuntimeVisualLink(
          childDataSource,
          parentDataSource,
          childColumnName,
          parentColumnName,
        );

        this.#runtimeVisualLinks.set(childVpId, runtimeVisualLink);

        resolve({
          clientViewportId: childVpId,
          colName: childColumnName,
          parentColName: parentColumnName,
          parentViewportId: parentVpId,
          type: "vuu-link-created",
        } as DataSourceVisualLinkCreatedMessage);
      } else {
        const runtimeVisualLink = this.#runtimeVisualLinks.get(
          message.childVpId,
        );
        if (runtimeVisualLink) {
          runtimeVisualLink.remove();
          this.#runtimeVisualLinks.delete(message.childVpId);
        } else {
          throw Error(
            `visualLinkService no visual link found for viewport #${message.childVpId}`,
          );
        }
        resolve();
      }
    });

  createDataSource = (
    tableName: T,
    viewport?: string,
    config?: DataSourceConfig,
  ) => {
    const getVisualLinks = (tableName: string) => {
      const linksForTable = this.visualLinks?.[tableName as T] as VuuLink[];
      return linksForTable === undefined
        ? undefined
        : this.getLinks(this.#subscriptionMap, linksForTable);
    };

    const columnDescriptors = this.getColumnDescriptors(tableName);
    const table = this.tables[tableName];
    const sessionTable = this.#sessionTableMap[tableName];

    const dataSource: DataSource = new TickingArrayDataSource({
      ...config,
      columnDescriptors,
      getVisualLinks,
      keyColumn:
        this.schemas[tableName] === undefined
          ? this.#sessionTableMap[tableName].schema.key
          : this.schemas[tableName].key,
      table: table || sessionTable,
      menu: this.menus?.[tableName],
      rpcServices: this.getServices(tableName),
      sessionTables: this.#sessionTableMap,
      viewport,
      visualLinkService: this.visualLinkService,
    });

    dataSource.on("unsubscribed", this.unregisterViewport);

    const existingSubscriptions = this.#subscriptionMap.get(tableName);
    const subscription = {
      viewportId: dataSource.viewport as string,
      dataSource,
    };
    if (existingSubscriptions) {
      existingSubscriptions.push(subscription);
    } else {
      this.#subscriptionMap.set(tableName, [subscription]);
    }

    return dataSource;
  };

  getServices(tableName: T) {
    const tableServices = this.services?.[tableName];
    if (Array.isArray(tableServices)) {
      return this.#moduleServices.concat(tableServices);
    } else {
      return this.#moduleServices;
    }
  }

  protected get sessionTableMap() {
    return this.#sessionTableMap;
  }

  private getSessionTable(sessionTableName: string) {
    const sessionTable = this.#sessionTableMap[sessionTableName];
    if (sessionTable) {
      return sessionTable;
    } else {
      throw Error(
        `getSessionTable: no session table with name ${sessionTableName}`,
      );
    }
  }

  private getColumnDescriptors(tableName: T) {
    const schema =
      this.schemas[tableName] || this.getSessionTable(tableName)?.schema;
    if (schema) {
      return schema.columns;
    } else {
      throw Error(
        ` no schema found for module ${this.#name} table ${tableName}`,
      );
    }
  }

  private openBulkEdits: ServiceHandler = async (rpcRequest) => {
    if (withParams(rpcRequest)) {
      const { namedParams, vpId } = rpcRequest;
      const selectedRowIds = namedParams.selectedRowIds as string[];
      const table = namedParams.table as VuuTable;

      if (selectedRowIds && table) {
        const dataTable = this.tables[table.table as T];
        if (dataTable) {
          const sessionTable = this.createSessionTableFromSelectedRows(
            dataTable,
            selectedRowIds,
          );
          const sessionTableName = `session-${uuid()}`;
          this.#sessionTableMap[sessionTableName] = sessionTable;

          return {
            action: {
              renderComponent: "grid",
              table: {
                module: table.module,
                table: sessionTableName,
              },
              tableSchema: dataTable.schema,
              type: "OPEN_DIALOG_ACTION",
            } as OpenDialogActionWithSchema,
            rpcName: "VP_BULK_EDIT_BEGIN_RPC",
            type: "VIEW_PORT_MENU_RESP",
            vpId,
          } as VuuRpcMenuResponse;
        } else {
          return {
            action: { type: "NO_ACTION" },
            clientViewportId: "na",
            error: "No Table found",
            rpcName: "VP_BULK_EDIT_REJECT",
            type: "VIEW_PORT_MENU_REJ",
            vpId,
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
        method: "???",
        namedParams: {},
        params: [],
        type: "VIEW_PORT_RPC_RESPONSE",
        vpId,
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
          value as VuuRowDataItemType,
        );
      }
      return {
        action: {
          type: "NO_ACTION",
        },
        rpcName: "VP_BULK_EDIT_COLUMN_CELLS_RPC",
        type: "VIEW_PORT_MENU_RESP",
        vpId,
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
      const baseTable = this.tables[table as T];
      if (baseTable) {
        for (let i = 0; i < sessionTable.data.length; i++) {
          const newRow = sessionTable.data[i];
          baseTable.updateRow(newRow);
        }

        return {
          action: {
            type: "VP_RPC_SUCCESS",
          },
          requestId: "request_id",
          rpcName: "VP_BULK_EDIT_SUBMIT_RPC",
          type: "VIEW_PORT_MENU_RESP",
          vpId,
        } as unknown as VuuRpcViewportResponse;
      }
    }
    throw Error("saveBulkEdits base table not found");
  };

  protected createSessionTableFromSelectedRows(
    { data, map, schema }: Table,
    selectedRowIds: string[],
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
    {
      rpcName: "VP_BULK_EDIT_END_RPC",
      service: this.endEditSession,
    },
  ];
}
