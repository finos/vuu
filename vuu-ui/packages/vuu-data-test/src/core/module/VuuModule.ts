import {
  DataSource,
  DataSourceConfig,
  DataSourceVisualLinkCreatedMessage,
  EditSessionMode,
  TableSchema,
} from "@vuu-ui/vuu-data-types";
import {
  VuuMenu,
  VuuRowDataItemType,
  VuuLink,
  LinkDescriptorWithLabel,
  VuuRpcMenuResponse,
  VuuCreateVisualLink,
  VuuRemoveVisualLink,
  VuuRpcServiceRequest,
  RpcResultSuccess,
  RpcResultError,
  VuuRpcMenuRequest,
  VuuTable,
} from "@vuu-ui/vuu-protocol-types";
import { isRpcSuccess, uuid } from "@vuu-ui/vuu-utils";
import { Table, buildDataColumnMapFromSchema } from "../../Table";
import { isProxySessionTable, SessionTable } from "../../SessionTable";
import { TickingArrayDataSource } from "../../TickingArrayDataSource";
import { RuntimeVisualLink } from "../../RuntimeVisualLink";
import moduleContainer from "./ModuleContainer";

const assertUpdateIsValid = (
  schema: TableSchema,
  column: string,
  data: VuuRowDataItemType,
) => {
  const col = schema.columns.find((col) => col.name === column);
  if (col) {
    console.log(`data type ${col.serverDataType} data ${data}`);
    // switch (col.serverDataType){
    // }
  } else {
    throw Error(
      `schema for table ${schema.table.table} does not include column ${column}`,
    );
  }
};

export interface IVuuModule<T extends string = string> {
  createDataSource: (tableName: T) => DataSource;
}

export type SessionTableMap = Record<string, SessionTable | Table>;

export type ServiceHandler = (
  rpcRequest: VuuRpcServiceRequest,
) => Promise<RpcResultSuccess | RpcResultError>;

export type MenuServiceHandler = (
  rpcRequest: VuuRpcMenuRequest,
) => Promise<VuuRpcMenuResponse>;

export type RpcService = {
  rpcName: string;
  service: ServiceHandler;
};

export type RpcMenuService = {
  rpcName: string;
  service: MenuServiceHandler;
};

type Subscription = {
  viewportId: string;
  dataSource: DataSource;
  sessionTableName?: string;
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

  protected get sessionTableMap() {
    return this.#sessionTableMap;
  }

  protected getSessionTable(sessionTableName: string): SessionTable;
  protected getSessionTable(
    sessionTableName: string,
    throwIfNotFound: true,
  ): SessionTable;
  protected getSessionTable(
    sessionTableName: string,
    throwIfNotFound: false,
  ): SessionTable | undefined;
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
        sessionTable.delete(key as string);
        return {
          type: "SUCCESS_RESULT",
          data: undefined,
        };
      } else {
        const { dataSource } = this.getSubscriptionByViewport(viewPortId);
        if (dataSource.table) {
          const table = this.tables[dataSource.table.table as T];
          if (table) {
            table.delete(key as string);
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

  private editCell: ServiceHandler = async (rpcRequest) => {
    if (rpcRequest.context.type === "VIEWPORT_CONTEXT") {
      const { viewPortId } = rpcRequest.context;
      const { column, data, key } = rpcRequest.params;
      let targetTable: SessionTable | Table = this.#sessionTableMap[viewPortId];
      if (!targetTable) {
        const { dataSource } = this.getSubscriptionByViewport(viewPortId);
        if (dataSource.table) {
          targetTable = this.tables[dataSource.table.table as T];
        }
      }
      if (targetTable) {
        try {
          assertUpdateIsValid(targetTable.schema, column as string, data);
          targetTable.update(key as string, column as string, data);
          return {
            type: "SUCCESS_RESULT",
            data: undefined,
          };
        } catch (e) {
          const { message } = e as Error;
          return {
            type: "ERROR_RESULT",
            errorMessage: message,
          };
        }
      } else {
        throw Error("[VuuModule] editCell unable to find table for dataSource");
      }
    } else {
      throw Error(`[VuuModule] editCell invalid rpc type`);
    }
  };

  private beginEditSessionMenuHandler: MenuServiceHandler = async ({
    rpcName,
    type,
    vpId,
  }) => {
    if (type === "VIEW_PORT_MENUS_SELECT_RPC") {
      console.log(`rpcName ${rpcName}`);

      const result = await this.beginEditSession({
        context: {
          type: "VIEWPORT_CONTEXT",
          viewPortId: vpId,
        },
        params: {
          editSessionMode: "selected-rows",
        },
        rpcName,
        type: "RPC_REQUEST",
      });
      if (isRpcSuccess(result)) {
        const { table } = result.data as { table: VuuTable };
        return {
          type: "VIEW_PORT_MENU_RESP",
          rpcName,
          action: {
            renderComponent: "grid",
            type: "OPEN_DIALOG_ACTION",
            table,
          },
          vpId,
        };
      } else {
        return {
          error: result.errorMessage,
          rpcName,
          type: "VIEW_PORT_MENU_REJ",
          vpId,
        };
      }
    } else {
      return {
        error: "no can do",
        rpcName,
        type: "VIEW_PORT_MENU_REJ",
        vpId,
      };
    }
  };

  private beginEditSession: ServiceHandler = async (rpcRequest) => {
    if (rpcRequest.context.type === "VIEWPORT_CONTEXT") {
      const { viewPortId } = rpcRequest.context;
      const { editSessionMode = "all-rows" } = rpcRequest.params;
      const subscription = this.getSubscriptionByViewport(viewPortId);
      const { dataSource } = subscription;
      const { table: vuuTable } = dataSource;
      if (vuuTable) {
        const sourceTable = this.tables[vuuTable.table as T];
        if (sourceTable) {
          const sessionTableName = `session-${uuid()}`;
          const sessionTable = this.createSessionTable(
            sourceTable,
            sessionTableName,
            editSessionMode as EditSessionMode,
            dataSource as TickingArrayDataSource,
          );
          this.#sessionTableMap[sessionTableName] = sessionTable;
          subscription.sessionTableName = sessionTableName;

          return {
            data: {
              renderComponent: "inline-form",
              table: {
                module: vuuTable.module,
                table: sessionTableName,
              },
            },
            type: "SUCCESS_RESULT",
          };
        }
      }
    } else {
      throw Error(`[VuuModule] endEditSession invalid rpc type`);
    }

    return {
      type: "ERROR_RESULT",
      errorMessage: "not implemented yet",
    };
  };

  private endEditSession: ServiceHandler = async (rpcRequest) => {
    if (rpcRequest.context.type === "VIEWPORT_CONTEXT") {
      const { viewPortId } = rpcRequest.context;
      // the viewport Id is the session table name
      const sessionTable = this.#sessionTableMap[viewPortId];
      delete this.#sessionTableMap[viewPortId];
      const { dataSource } = this.getSubscriptionByViewport(viewPortId);

      if (dataSource.table) {
        const sourceTable = this.tables[dataSource.table.table as T];

        if (rpcRequest.params.save === true) {
          if (isProxySessionTable(sessionTable)) {
            const updates = sessionTable.getSessionUpdates();
            updates.forEach((rowUpdates, key) => {
              const { cellUpdates, lastUpdateTimestamp } = rowUpdates;
              const currentRow = sourceTable.findByKey(key);
              const lastUpdateTimestampOnTable =
                currentRow[sourceTable.map.vuuUpdatedTimestamp];
              if (lastUpdateTimestamp !== lastUpdateTimestampOnTable) {
                console.log("Houston WE HAVE a PROBLEM");
              }
              Object.entries(cellUpdates).forEach(([column, value]) => {
                sourceTable.update(key, column, value);
              });
            });
            updates.clear();
          } else {
            for (let i = 0; i < sessionTable.data.length; i++) {
              const newRow = sessionTable.data[i];
              sourceTable.updateRow(newRow);
            }
          }
        }

        return {
          type: "SUCCESS_RESULT",
          data: undefined,
        };
      } else {
        throw Error("[VuuModule], exitEditMode");
      }
    } else {
      throw Error(`[VuuModule] endEditSession invalid rpc type`);
    }

    // return {
    //   type: "ERROR_RESULT",
    //   errorMessage: "not implemented yet",
    // };
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

  protected createSessionTable(
    sourceTable: Table,
    sessionTableName: string,
    editSessionMode: EditSessionMode = "all-rows",
    dataSource: TickingArrayDataSource,
  ) {
    if (editSessionMode === "all-rows") {
      return this.createSessionTableWithAllRows(sourceTable, sessionTableName);
    } else if (editSessionMode === "selected-rows") {
      return this.createSessionTableFromSelectedRows(
        sourceTable,
        sessionTableName,
        dataSource,
      );
    } else {
      throw Error(
        `[VuuModule] createSessionTable, invalid editSessionMode ${editSessionMode}`,
      );
    }
  }

  protected createSessionTableWithAllRows(
    sourceTable: Table,
    sessionTableName: string,
  ) {
    return SessionTable(sourceTable, sessionTableName);
  }

  protected createSessionTableFromSelectedRows(
    { data, map, schema }: Table,
    sessionTableName: string,
    dataSource: TickingArrayDataSource,
  ) {
    const selectedRowIds = dataSource.getSelectedRowIds();
    const keyIndex = map[schema.key];
    const sessionData: VuuRowDataItemType[][] = [];
    for (let i = 0; i < selectedRowIds.length; i++) {
      for (let j = 0; j < data.length; j++) {
        if (data[j][keyIndex] === selectedRowIds[i]) {
          sessionData.push(data[j]);
        }
      }
    }
    // Note we use the original table schema for the session table, including table name.
    // This will later be used to retrieve source table
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
      rpcName: "beginEditSession",
      service: this.beginEditSession,
    },
    {
      rpcName: "endEditSession",
      service: this.endEditSession,
    },
    {
      rpcName: "editCell",
      service: this.editCell,
    },
  ];

  /**
   * These services are available on any table. The client must configure the appropriate
   * menu item(s) on Table(s). The services to implement these RPC calls are built-in to
   * VuuModule
   */
  #moduleMenuServices: RpcMenuService[] = [
    {
      rpcName: "beginEditSession",
      service: this.beginEditSessionMenuHandler,
    },
  ];
}
