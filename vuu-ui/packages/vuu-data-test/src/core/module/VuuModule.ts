import {
  DataSource,
  DataSourceConfig,
  DataSourceVisualLinkCreatedMessage,
  OpenDialogActionWithSchema,
  TableSchema,
} from "@vuu-ui/vuu-data-types";
import {
  VuuMenu,
  VuuRowDataItemType,
  VuuTable,
  VuuLink,
  LinkDescriptorWithLabel,
  VuuRpcMenuResponse,
  VuuCreateVisualLink,
  VuuRemoveVisualLink,
  VuuRpcServiceRequest,
  RpcResultSuccess,
  RpcResultError,
  VuuRpcMenuRequest,
  VuuRpcEditRequest,
  VuuRpcEditResponse,
} from "@vuu-ui/vuu-protocol-types";
import { uuid } from "@vuu-ui/vuu-utils";
import { Table, buildDataColumnMapFromSchema } from "../../Table";
import { TickingArrayDataSource } from "../../TickingArrayDataSource";
import { RuntimeVisualLink } from "../../RuntimeVisualLink";
import moduleContainer from "./ModuleContainer";

export interface IVuuModule<T extends string = string> {
  createDataSource: (tableName: T) => DataSource;
}

export type SessionTableMap = Record<string, Table>;

export type LocalDataMenuParameters = {
  selectedRowIds: string[];
  table: VuuTable;
};

export type ServiceHandler = (
  rpcRequest: VuuRpcServiceRequest,
) => Promise<RpcResultSuccess | RpcResultError>;

export type MenuServiceHandler = (
  rpcRequest: VuuRpcMenuRequest & {
    localDataParameters?: LocalDataMenuParameters;
  },
) => Promise<VuuRpcMenuResponse>;

export type EditServiceHandler<
  T extends VuuRpcEditRequest = VuuRpcEditRequest,
> = (rpcRequest: T) => Promise<VuuRpcEditResponse>;

export type RpcService = {
  rpcName: string;
  service: ServiceHandler;
};

export type RpcMenuService = {
  rpcName: string;
  service: MenuServiceHandler;
};

export type RpcEditService = {
  type: "VP_EDIT_CELL_RPC";
  service: EditServiceHandler;
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
  protected abstract editServices?:
    | Record<T, RpcEditService[] | undefined>
    | undefined;
  protected abstract menuServices?:
    | Record<T, RpcMenuService[] | undefined>
    | undefined;
  protected abstract services?: Record<T, RpcService[] | undefined> | undefined;
  protected abstract visualLinks?: Record<T, VuuLink[] | undefined>;

  getTableSchema(tableName: string) {
    return this.schemas[tableName as T];
  }

  getTableList() {
    return Object.keys(this.tables);
  }

  protected unregisterViewport = (viewportId: string) => {
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

  getSubscriptionByViewport(viewportId: string) {
    for (const subscriptions of this.#subscriptionMap.values()) {
      for (const subscription of subscriptions) {
        if (subscription.viewportId === viewportId) {
          return subscription;
        }
      }
    }
    throw Error(
      `[VuuModule] getSubscriptionByViewport, no subscription found for ${viewportId}`,
    );
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
      rpcEditServices: this.getEditServices(tableName),
      rpcMenuServices: this.getMenuServices(tableName),
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

  getMenuServices(tableName: T) {
    const tableServices = this.menuServices?.[tableName];
    if (Array.isArray(tableServices)) {
      return this.#moduleMenuServices.concat(tableServices);
    } else {
      return this.#moduleMenuServices;
    }
  }

  getEditServices(tableName: T) {
    const tableServices = this.editServices?.[tableName];
    if (Array.isArray(tableServices)) {
      return this.#moduleEditServices.concat(tableServices);
    } else {
      return this.#moduleEditServices;
    }
  }

  protected get sessionTableMap() {
    return this.#sessionTableMap;
  }

  protected getSessionTable(sessionTableName: string): Table;
  protected getSessionTable(
    sessionTableName: string,
    throwIfNotFound: true,
  ): Table;
  protected getSessionTable(
    sessionTableName: string,
    throwIfNotFound: false,
  ): Table | undefined;
  protected getSessionTable(sessionTableName: string, throwIfNotFound = true) {
    const sessionTable = this.#sessionTableMap[sessionTableName];
    if (sessionTable) {
      return sessionTable;
    } else if (throwIfNotFound) {
      throw Error(
        `getSessionTable: no session table with name ${sessionTableName}`,
      );
    }
  }

  protected deleteRow: ServiceHandler = async (rpcRequest) => {
    if (rpcRequest.context.type === "VIEWPORT_CONTEXT") {
      const { viewPortId } = rpcRequest.context;
      const { key } = rpcRequest.params;
      const sessionTable = this.getSessionTable(viewPortId, false);
      if (sessionTable) {
        sessionTable.delete(key);
        return {
          type: "SUCCESS_RESULT",
          data: undefined,
        };
      } else {
        const { dataSource } = this.getSubscriptionByViewport(viewPortId);
        if (dataSource.table) {
          const table = this.tables[dataSource.table.table as T];
          if (table) {
            table.delete(key);
            return {
              type: "SUCCESS_RESULT",
              data: undefined,
            };
          }
        }
      }
    }
    return {
      type: "ERROR_RESULT",
      errorMessage: "something went wrong",
    };
  };

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

  private editCell: EditServiceHandler<VuuRpcEditRequest> = async (
    rpcRequest,
  ) => {
    if (rpcRequest.type === "VP_EDIT_CELL_RPC") {
      const { rowKey, field, value } = rpcRequest;
      // are we editing a session table ? Session table name is same as viewport id
      let targetTable = this.#sessionTableMap[rpcRequest.vpId];
      if (!targetTable) {
        const { dataSource } = this.getSubscriptionByViewport(rpcRequest.vpId);
        if (dataSource.table) {
          targetTable = this.tables[dataSource.table.table as T];
        }
      }

      if (targetTable) {
        targetTable.update(rowKey, field, value);

        return {
          action: undefined,
          type: "VP_EDIT_RPC_RESPONSE",
          rpcName: "VP_EDIT_SUBMIT_FORM_RPC",
          vpId: rpcRequest.vpId,
        };
      } else {
        throw Error("[VuuModule] editCell unable to find table for dataSource");
      }
    } else {
      throw Error("[VuuModule] editCell invalid rpc message type");
    }
  };

  private beginBulkEdit: MenuServiceHandler = async (rpcRequest) => {
    if (rpcRequest.localDataParameters) {
      const { localDataParameters, vpId } = rpcRequest;
      const selectedRowIds = localDataParameters.selectedRowIds;
      const table = localDataParameters.table;

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
    if (rpcRequest.context.type === "VIEWPORT_CONTEXT") {
      const { viewPortId } = rpcRequest.context;
      delete this.#sessionTableMap[viewPortId];
      return {
        type: "SUCCESS_RESULT",
        data: undefined,
      };
    } else {
      throw Error(`[VuuModule] endEditSession invalid rpc type`);
    }
  };

  // Bulk-edit with input in session table
  private applyBulkEdits: ServiceHandler = async (rpcRequest) => {
    if (rpcRequest.context.type === "VIEWPORT_CONTEXT") {
      const { viewPortId } = rpcRequest.context;
      const sessionTable = this.getSessionTable(viewPortId);
      for (let i = 0; i < sessionTable.data.length; i++) {
        const newRow = sessionTable.data[i];
        const { column, value } = rpcRequest.params;
        const keyIndex = sessionTable.map[sessionTable.schema.key];
        sessionTable.update(
          String(newRow[keyIndex]),
          column as string,
          value as VuuRowDataItemType,
        );
      }
      return {
        type: "SUCCESS_RESULT",
        data: undefined,
      };
    } else {
      throw Error(`[VuuModule] applyBulkEdits invalid rpc type`);
    }
  };

  // Save session table data to main table
  private saveBulkEdits: ServiceHandler = async (rpcRequest) => {
    if (rpcRequest.context.type === "VIEWPORT_CONTEXT") {
      const { viewPortId } = rpcRequest.context;
      const sessionTable = this.getSessionTable(viewPortId);
      const { table } = sessionTable.schema.table;
      const baseTable = this.tables[table as T];
      if (baseTable) {
        for (let i = 0; i < sessionTable.data.length; i++) {
          const newRow = sessionTable.data[i];
          baseTable.updateRow(newRow);
        }
        return {
          type: "SUCCESS_RESULT",
          data: undefined,
        };
      } else {
        throw Error(
          `[VuuModule] saveBulkEdits session base table ${table} not found for session table ${sessionTable.name}`,
        );
      }
    } else {
      throw Error("[BasketModule] createNewBasket invalid request type");
    }
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

  /**
   * These services are available on any table. The client must configure the appropriate
   * menu item(s) on Table(s). The services to implement these RPC calls are built-in to
   * VuuModule
   */
  #moduleMenuServices: RpcMenuService[] = [
    {
      rpcName: "VP_BULK_EDIT_BEGIN_RPC",
      service: this.beginBulkEdit,
    },
  ];

  /**
   * These services are available on any table. The client must configure the appropriate
   * menu item(s) on Table(s). The services to implement these RPC calls are built-in to
   * VuuModule
   */
  #moduleEditServices: RpcEditService[] = [
    {
      type: "VP_EDIT_CELL_RPC",
      service: this.editCell,
    },
  ];
}
