import {
  DataSource,
  DataSourceConfig,
  DataSourceSubscribedMessage,
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
  VuuDataRow,
} from "@vuu-ui/vuu-protocol-types";
import {
  isAddRowRpcRequest,
  isBeginEditSessionRpcRequest,
  isEditCellRpcRequest,
  isEndEditSessionRpcRequest,
  isRpcSuccess,
  uuid,
} from "@vuu-ui/vuu-utils";
import { Table, buildDataColumnMapFromSchema } from "../../Table";
import { isProxySessionTable, SessionTable } from "../../SessionTable";
import { TickingArrayDataSource } from "../../TickingArrayDataSource";
import { RuntimeVisualLink } from "../../RuntimeVisualLink";
import moduleContainer from "./ModuleContainer";
import { sessionTableSchema } from "../../session-table-utils";

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
  createDataSource: (
    tableName: T,
    viewport?: string,
    config?: DataSourceConfig,
  ) => DataSource;
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
    return (
      this.schemas[tableName as T] ?? this.#sessionTableMap[tableName]?.schema
    );
  }

  getTableList() {
    return Object.keys(this.tables);
  }

  protected handlePostSubscribeActivities = ({
    clientViewportId,
    tableSchema,
  }: DataSourceSubscribedMessage) => {
    const visualLinks = this.getVisualLinks(tableSchema.table.table);
    const { dataSource } = this.getSubscriptionByViewport(clientViewportId);
    requestAnimationFrame(() => {
      dataSource.links = visualLinks;
    });

    // check whether newly subscribed viewport is associated with table that is a potential
    // visual link target. If so send links update message to any active subscription
    // associated with a table that is a potential link source
    if (this.visualLinks && dataSource.tableSchema) {
      const {
        table: { table: sourceTable },
      } = dataSource.tableSchema;
      for (const [table, links] of Object.entries<VuuLink[] | undefined>(
        this.visualLinks,
      )) {
        if (links) {
          const potentialTargets = links.filter(
            (l) => l.toTable === sourceTable,
          );
          if (potentialTargets.length) {
            for (const subscriptions of this.#subscriptionMap.values()) {
              for (const { dataSource } of subscriptions) {
                if (dataSource.tableSchema?.table.table === table) {
                  dataSource.links = this.getVisualLinks(table);
                }
              }
            }
          }
        }
      }
    }
  };

  protected unregisterViewport = (viewportId: string) => {
    const { dataSource } = this.getSubscriptionByViewport(viewportId);
    const tableName = dataSource.tableSchema?.table.table;
    if (tableName) {
      const subscriptionsForTable = this.#subscriptionMap.get(tableName);
      if (subscriptionsForTable) {
        for (const { viewportId: vp } of subscriptionsForTable) {
          if (vp === viewportId) {
            if (subscriptionsForTable.length === 1) {
              this.#subscriptionMap.delete(tableName);
            } else {
              this.#subscriptionMap.set(
                tableName,
                subscriptionsForTable.filter(
                  (s) => s.viewportId !== viewportId,
                ),
              );
            }
          }
        }
      }
    }

    for (const [tableName, subscriptions] of this.#subscriptionMap) {
      if (subscriptions[0].viewportId.toString() === viewportId) {
        this.#subscriptionMap.delete(tableName);
      }
    }

    // check whether newly unsubscribed viewport is associated with table that is a potential
    // visual link target. If so send links update message to any active subscription
    // associated with a table that is a potential link source
    if (this.visualLinks && dataSource.tableSchema) {
      const {
        table: { table: sourceTable },
      } = dataSource.tableSchema;
      for (const [table, links] of Object.entries<VuuLink[] | undefined>(
        this.visualLinks,
      )) {
        if (links) {
          const potentialTargets = links.filter(
            (l) => l.toTable === sourceTable,
          );
          if (potentialTargets.length) {
            for (const subscriptions of this.#subscriptionMap.values()) {
              for (const { dataSource } of subscriptions) {
                if (dataSource.tableSchema?.table.table === table) {
                  dataSource.links = this.getVisualLinks(table);
                }
              }
            }
          }
        }
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

  getVisualLinks = (tableName: string) => {
    const linksForTable = this.visualLinks?.[tableName as T] as VuuLink[];
    return linksForTable === undefined
      ? undefined
      : this.getLinks(this.#subscriptionMap, linksForTable);
  };

  createDataSource = (
    tableName: T,
    viewport?: string,
    config?: DataSourceConfig,
  ) => {
    const columnDescriptors = this.getColumnDescriptors(tableName);
    const table = this.tables[tableName];
    const sessionTable = this.#sessionTableMap[tableName];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vuuModule = this as IVuuModule<any>;

    const dataSource: DataSource = new TickingArrayDataSource({
      ...config,
      columnDescriptors,
      getVisualLinks: this.getVisualLinks,
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
      vuuModule,
    });

    dataSource.on("subscribed", this.handlePostSubscribeActivities);
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
      const { key, mode = "hard" } = rpcRequest.params as {
        key: string;
        mode?: "soft" | "hard";
      };
      const sessionTable = this.getSessionTable(viewPortId, false);
      if (sessionTable) {
        if (mode === "soft") {
          sessionTable.update(key, "vuuMsg", "SOFT_DELETED");
        } else {
          sessionTable.delete(key);
        }
        return { type: "SUCCESS_RESULT", data: undefined };
      } else {
        const { dataSource } = this.getSubscriptionByViewport(viewPortId);
        if (dataSource.table) {
          const table = this.tables[dataSource.table.table as T];
          if (table) {
            if (mode === "soft") {
              table.update(key, "vuuMsg", "SOFT_DELETED");
            } else {
              table.delete(key);
            }
            return { type: "SUCCESS_RESULT", data: undefined };
          }
        }
      }
    }
    return { type: "ERROR_RESULT", errorMessage: "something went wrong" };
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
    if (isEditCellRpcRequest(rpcRequest)) {
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
    if (isBeginEditSessionRpcRequest(rpcRequest)) {
      const { viewPortId } = rpcRequest.context;
      const { editSessionMode = "inline-all-rows" } = rpcRequest.params;
      const subscription = this.getSubscriptionByViewport(viewPortId);
      const { dataSource } = subscription;
      const { table: vuuTable } = dataSource;
      if (vuuTable) {
        const sourceTable = this.tables[vuuTable.table as T];
        if (sourceTable) {
          const sessionTableName = `session-${uuid()}`;
          try {
            const sessionTable = this.createSessionTable(
              sourceTable,
              sessionTableName,
              editSessionMode as EditSessionMode,
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
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
          } catch (e) {
            return {
              type: "ERROR_RESULT",
              errorMessage: (e as Error).message,
            };
          }
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

  private addRow: ServiceHandler = async (rpcRequest) => {
    if (isAddRowRpcRequest(rpcRequest)) {
      const { viewPortId } = rpcRequest.context;
      const subscription = this.getSubscriptionByViewport(viewPortId);
      const sessionTable = subscription.sessionTableName
        ? this.#sessionTableMap[subscription.sessionTableName]
        : undefined;
      if (!sessionTable) {
        return {
          type: "ERROR_RESULT",
          errorMessage: `addRow: no active session table for viewport ${viewPortId}`,
        };
      }
      const { data } = rpcRequest.params;

      const columnMap = sessionTable.map;
      const columnCount = Object.keys(columnMap).length;
      const row: VuuDataRow = new Array(columnCount).fill("");
      for (const [col, idx] of Object.entries(columnMap)) {
        if (data[col] !== undefined) {
          row[idx] = data[col];
        }
      }
      sessionTable.insert(row);
      return { type: "SUCCESS_RESULT", data: undefined };
    }
    return {
      type: "ERROR_RESULT",
      errorMessage: "addRow: invalid rpc context",
    };
  };

  private endEditSession: ServiceHandler = async (rpcRequest) => {
    if (isEndEditSessionRpcRequest(rpcRequest)) {
      const { viewPortId } = rpcRequest.context;
      // the viewport Id is the session table name
      const subscription = this.getSubscriptionByViewport(viewPortId);
      const sessionTableName = subscription.sessionTableName ?? viewPortId;
      const sessionTable = this.#sessionTableMap[sessionTableName];
      const { dataSource } = subscription;

      if (dataSource.table) {
        const sourceTable = this.tables[dataSource.table.table as T];

        if (rpcRequest.params.save === true) {
          let rejectedCount = 0;
          if (isProxySessionTable(sessionTable)) {
            const updates = sessionTable.getSessionUpdates();
            updates.forEach((rowUpdates, key) => {
              const { cellUpdates, lastUpdateTimestamp } = rowUpdates;
              const currentRow = sourceTable.findByKey(key);
              const lastUpdateTimestampOnTable =
                currentRow[sourceTable.map.vuuUpdatedTimestamp];
              if (lastUpdateTimestamp !== lastUpdateTimestampOnTable) {
                // We will reject updates for this row, update sessionn table row with message
                rejectedCount += 1;
                const sessionTableRow = sessionTable.findByKey(key);
                const newRow = sessionTableRow.slice();
                const messages: string[] = [];
                Object.entries(cellUpdates).forEach(([column, value]) => {
                  messages.push(`${column}:${value}`);
                });
                newRow[sessionTable.map.vuuMsg] = messages.join(",");
                sessionTable.updateRow(newRow);
              } else {
                const newRow = currentRow.slice();
                Object.entries(cellUpdates).forEach(([column, value]) => {
                  newRow[sourceTable.map[column]] = value;
                });
                sourceTable.updateRow(newRow);
              }
            });
            updates.clear();
          } else {
            // empty-session-table / csv-upload: insert only rows with no errors.
            // vuuMsg is empty string for valid rows and non-empty for error rows.
            const vuuMsgIdx = sessionTable.map["vuuMsg"];
            const sourceColumns = sourceTable.schema.columns;
            for (let i = 0; i < sessionTable.data.length; i++) {
              const sessionRow = sessionTable.data[i];
              if (sessionRow[vuuMsgIdx]) continue;
              const sourceRow: VuuRowDataItemType[] = sourceColumns.map(
                (col) => sessionRow[sessionTable.map[col.name]],
              );
              sourceTable.insert(sourceRow);
            }
          }

          if (rejectedCount > 0) {
            return {
              errorMessage: "stale update",
              type: "ERROR_RESULT",
            };
          } else {
            return {
              type: "SUCCESS_RESULT",
              data: undefined,
            };
          }
        } else {
          return {
            type: "SUCCESS_RESULT",
            data: undefined,
          };
        }
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
        const { column, value } = rpcRequest.params as {
          column: NamedCurve;
          value: VuuRowDataItemType;
        };
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
    editSessionMode: EditSessionMode = "inline-all-rows",
    dataSource: TickingArrayDataSource,
  ) {
    if (editSessionMode.endsWith("all-rows")) {
      return this.createSessionTableWithAllRows(sourceTable, sessionTableName);
    } else if (editSessionMode === "selected-rows") {
      return this.createSessionTableFromSelectedRows(
        sourceTable,
        sessionTableName,
        dataSource,
      );
    } else if (editSessionMode === "empty-session-table") {
      return this.createEmptySessionTable(sourceTable, sessionTableName);
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

  protected createEmptySessionTable(
    { schema }: Table,
    sessionTableName: string,
  ) {
    // Override schema.table.table so isSessionTable() returns true for this session.
    // sessionTableSchema adds the vuuMsg column, consistent with all other session tables.
    const sessionSchema = sessionTableSchema({
      ...schema,
      table: { ...schema.table, table: sessionTableName },
    });
    return new Table(sessionSchema, [], buildDataColumnMapFromSchema(sessionSchema));
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
    // Note we preserve the original table name on the schema for the session table,
    // this will later be used to retrieve source table
    const sessionSchema = sessionTableSchema(schema);

    return new Table(
      sessionSchema,
      sessionData,
      buildDataColumnMapFromSchema(sessionSchema),
    );
  }

  /**
   * These services are available on any table. The client must configure the appropriate
   * menu item(s) on Table(s). The services to implement these RPC calls are built-in to
   * VuuModule
   */
  #moduleServices: RpcService[] = [
    {
      rpcName: "addRow",
      service: this.addRow,
    },
    {
      rpcName: "VP_BULK_EDIT_COLUMN_CELLS_RPC",
      service: this.applyBulkEdits,
    },
    {
      rpcName: "beginEditSession",
      service: this.beginEditSession,
    },
    {
      rpcName: "deleteRow",
      service: this.deleteRow,
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
