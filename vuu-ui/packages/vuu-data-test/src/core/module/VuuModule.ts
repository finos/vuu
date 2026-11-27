import type {
  DataSourceBase,
  DataSourceConfig,
  DataSourceRowWithBigint,
  DataSourceSubscribedMessage,
  DataSourceVisualLinkCreatedMessage,
  DeleteRowMode,
  EditSessionMode,
  CopyOption,
  SessionDataSourceOverrides,
  SessionType,
  TableSchema,
} from "@vuu-ui/vuu-data-types";
import type {
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
  isCreateSessionTableRpcRequest,
  isDeleteSelectedRowsRpcRequest,
  isEditCellRpcRequest,
  isEndEditSessionRpcRequest,
  isRpcSuccess,
  isUndoRowChangeRpcRequest,
  uuid,
} from "@vuu-ui/vuu-utils";
import { Table, buildDataColumnMapFromSchema } from "../../Table";

type TableRow = Array<bigint | VuuRowDataItemType>;
import { TickingArrayDataSource } from "../../TickingArrayDataSource";
import { RuntimeVisualLink } from "../../RuntimeVisualLink";
import moduleContainer from "./ModuleContainer";
import { sessionTableRow, sessionTableSchema } from "../../session-table-utils";

const assertUpdateIsValid = (
  schema: TableSchema,
  column: string,
  _data: VuuRowDataItemType,
) => {
  const col = schema.columns.find((col) => col.name === column);
  if (col) {
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
    config?: DataSourceConfig & { session?: SessionDataSourceOverrides },
  ) => DataSourceBase<DataSourceRowWithBigint>;
}

export type SessionTableMap = Record<string, Table>;

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

export type VuuModuleOptions = {
  /** Column written by session services (deleteRow, endEditSession) to report row-level status.
   *  Defaults to `"vuuMsg"` which matches the column added by `sessionTableSchema`. */
  sessionTableMessageColumn?: string;
};

/**
 * A session table blueprint, the equivalent of Scala Vuu's
 * `ModuleFactory.addSessionTable(tableDef, viewPortDef)`. createSessionTable
 * creates per-session instances of a blueprint, selected by name.
 */
export type SessionTableDef = {
  /**
   * Columns of the session table. The session message column (vuuMsg) and
   * vuuAction are added if not defined. An import blueprint defines
   * vuuRowNum, the CSV row number of each imported row.
   */
  columns: TableSchema["columns"];
  key: string;
  /**
   * Services for viewports on instances of this session table. They replace
   * built-in services with the same rpcName. The source table's services do
   * not apply to its session tables.
   */
  services?: RpcService[];
  menuServices?: RpcMenuService[];
  menu?: VuuMenu;
};

/**
 * The default blueprints of a table, `<sessionType>-<table>`, with the
 * table's columns and key. The import blueprint adds vuuRowNum.
 */
export const sessionTableDefsFor = (
  { columns, key, table }: TableSchema,
  sessionTypes: readonly SessionType[] = ["edit", "import", "export"],
): Record<string, SessionTableDef> =>
  Object.fromEntries(
    sessionTypes.map((sessionType) => [
      `${sessionType}-${table.table}`,
      {
        columns:
          sessionType === "import"
            ? columns.concat({ name: "vuuRowNum", serverDataType: "int" })
            : columns,
        key,
      },
    ]),
  );

/** Named params of the createSessionTable RPC, as in Scala Vuu. */
type CreateSessionTableParams = {
  /**
   * Comma separated names of the source columns to copy, or "*". Default:
   * the source columns, excluding vuuCreatedTimestamp, vuuUpdatedTimestamp
   * and vuuMsg.
   */
  columnsToCopy?: string;
  /** Required for "edit" and "export". "import" always uses "Empty". */
  copyOption?: CopyOption;
  /** Name of the blueprint. Default `<sessionType>-<sourceTable>`. */
  sessionTableName?: string;
  sessionType?: SessionType;
};

type SessionInfo = {
  /** The blueprint the session table was created from. */
  sessionTableDef: SessionTableDef;
  /** Source columns copied into the session table. */
  copiedColumns: ReadonlySet<string>;
};

const SESSION_TYPES: readonly SessionType[] = ["edit", "import", "export"];
const COPY_OPTIONS: readonly CopyOption[] = ["All", "Selected", "Empty"];
const DEFAULT_COLUMN_NAMES: ReadonlySet<string> = new Set([
  "vuuCreatedTimestamp",
  "vuuUpdatedTimestamp",
  "vuuMsg",
]);
const isSessionType = (value: unknown): value is SessionType =>
  SESSION_TYPES.includes(value as SessionType);
const isCopyOption = (value: unknown): value is CopyOption =>
  COPY_OPTIONS.includes(value as CopyOption);

const errorResult = (errorMessage: string): RpcResultError => ({
  type: "ERROR_RESULT",
  errorMessage,
});

type Subscription = {
  viewportId: string;
  dataSource: DataSourceBase<DataSourceRowWithBigint>;
  sessionTableName?: string;
  sourceTableName?: string;
};
export abstract class VuuModule<T extends string = string>
  implements IVuuModule<T> {
  #name: string;
  #sessionTableMessageColumn: string;
  #runtimeVisualLinks = new Map<string, RuntimeVisualLink>();
  /** Session tables created from a blueprint, by session table name. */
  #sessionInfo = new Map<string, SessionInfo>();
  #sessionSourceTableMap: Record<string, T> = {};
  #sessionTableMap: SessionTableMap = {};
  #tableServices: Record<T, RpcService[] | undefined> | undefined;
  #subscriptionMap: Map<string, Subscription[]> = new Map();

  constructor(
    name: string,
    { sessionTableMessageColumn = "vuuMsg" }: VuuModuleOptions = {},
  ) {
    this.#name = name;
    this.#sessionTableMessageColumn = sessionTableMessageColumn;
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

  /**
   * Session table blueprints, keyed by name. createSessionTable fails if no
   * blueprint is defined under the requested name (default
   * `<sessionType>-<sourceTable>`), as in Scala Vuu.
   */
  protected sessionTableDefs?: Record<string, SessionTableDef>;
  /**
   * Tables that may be edited through a session table (sessionType "edit"
   * or "import"). Default none, as in Scala Vuu.
   */
  protected editableTables?: readonly T[];
  /** Maximum number of rows copied into a session table. */
  protected maxSessionTableSize = 10_000;

  /**
   * Server-side validation applied to every value submitted by editCell and
   * addRow. `tableName` is the source table, also when the edit targets a
   * session table. Return a message to reject the value, undefined to accept.
   */
  protected validateEdit(
    _tableName: T,
    _column: string,
    _value: VuuRowDataItemType,
  ): string | undefined {
    return undefined;
  }

  /**
   * Called when a session table created from a blueprint is created, and
   * after each request to it, e.g. editCell or addRow. `tableName` is the
   * source table. Use it to keep columns of the session table that the
   * server maintains up to date.
   */
  protected sessionTableChanged(_tableName: T, _sessionTable: Table) {
    // no columns maintained by default
  }

  /**
   * Key for a row added without one. `tableName` is the source table,
   * `data` the values of the new row, `key` the key the client suggested,
   * if any (an import row suggests its row number).
   */
  protected createRowKey(
    _tableName: T | undefined,
    _data: Record<string, VuuRowDataItemType>,
    key?: string,
  ): string {
    return key ?? uuid();
  }

  /** Message when an added row has the key of an existing row. */
  protected duplicateKeyMessage(
    _tableName: T | undefined,
    key: string,
    _data: Record<string, VuuRowDataItemType>,
  ): string {
    return `key ${key} already exists`;
  }

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

  getSubscribedDataSource(
    vpId: string,
  ): DataSourceBase<DataSourceRowWithBigint> {
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
    config?: DataSourceConfig & { session?: SessionDataSourceOverrides },
  ) => {
    const columnDescriptors = this.getColumnDescriptors(tableName);
    const table = this.tables[tableName];
    const sessionTable = this.#sessionTableMap[tableName];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vuuModule = this as IVuuModule<any>;

    const dataSource: DataSourceBase<DataSourceRowWithBigint> =
      new TickingArrayDataSource({
        ...config,
        columnDescriptors,
        getVisualLinks: this.getVisualLinks,
        keyColumn:
          this.schemas[tableName] === undefined
            ? this.#sessionTableMap[tableName].schema.key
            : this.schemas[tableName].key,
        table: table || sessionTable,
        menu: this.#sessionInfo.has(tableName)
          ? this.#sessionInfo.get(tableName)?.sessionTableDef.menu
          : this.menus?.[tableName],
        rpcServices: this.getServices(tableName),
        rpcMenuServices: this.getMenuServices(tableName),
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
      sessionTableName: sessionTable ? tableName : undefined,
      sourceTableName: this.#sessionSourceTableMap[tableName],
    };
    if (existingSubscriptions) {
      existingSubscriptions.push(subscription);
    } else {
      this.#subscriptionMap.set(tableName, [subscription]);
    }

    return dataSource;
  };

  /**
   * For a session table created from a blueprint, the blueprint's services,
   * which replace built-in services with the same rpcName.
   */
  getServices(tableName: T) {
    const sessionInfo = this.#sessionInfo.get(tableName);
    if (sessionInfo) {
      const { services = [] } = sessionInfo.sessionTableDef;
      return services
        .concat(
          this.#moduleServices.filter(
            ({ rpcName }) => !services.some((s) => s.rpcName === rpcName),
          ),
        )
        .map(({ rpcName, service }) => ({
          rpcName,
          service: async (rpcRequest: Parameters<ServiceHandler>[0]) => {
            const result = await service(rpcRequest);
            const sessionTable = this.#sessionTableMap[tableName];
            const sourceTableName = this.#sessionSourceTableMap[tableName];
            if (sessionTable && sourceTableName !== undefined) {
              this.sessionTableChanged(sourceTableName, sessionTable);
            }
            return result;
          },
        }));
    }
    const tableServices = this.services?.[tableName];
    if (Array.isArray(tableServices)) {
      return this.#moduleServices.concat(tableServices);
    } else {
      return this.#moduleServices;
    }
  }

  getMenuServices(tableName: T) {
    const tableServices = this.#sessionInfo.has(tableName)
      ? this.#sessionInfo.get(tableName)?.sessionTableDef.menuServices
      : this.menuServices?.[tableName];
    if (Array.isArray(tableServices)) {
      return this.#moduleMenuServices.concat(tableServices);
    } else {
      return this.#moduleMenuServices;
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

  /**
   * Soft-deletes a session table row, unless the row is an uncommitted insert
   * (vuuAction === "addRow"), in which case it is removed outright — there is
   * no prior state to restore.
   */
  #softDeleteSessionRow(sessionTable: Table, key: string) {
    const row = sessionTable.findByKey(key);
    if (row && row[sessionTable.map.vuuAction] === "addRow") {
      sessionTable.delete(key);
    } else {
      sessionTable.update(key, "vuuAction", "deleteRow");
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
          this.#softDeleteSessionRow(sessionTable, key);
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
              table.update(
                key,
                this.#sessionTableMessageColumn,
                "SOFT_DELETED",
              );
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

  private deleteSelectedRows: ServiceHandler = async (rpcRequest) => {
    if (isDeleteSelectedRowsRpcRequest(rpcRequest)) {
      const { viewPortId } = rpcRequest.context;
      const { mode = "soft" } = rpcRequest.params;
      const sessionTable = this.getSessionTable(viewPortId, false);
      if (sessionTable) {
        const { dataSource } = this.getSubscriptionByViewport(viewPortId);
        const selectedRowIds = (
          dataSource as TickingArrayDataSource
        ).getSelectedRowIds();
        if (selectedRowIds.length > 0) {
          for (const key of selectedRowIds) {
            if ((mode as DeleteRowMode) === "soft") {
              this.#softDeleteSessionRow(sessionTable, key);
            } else {
              sessionTable.delete(key);
            }
          }
          dataSource.select?.({ type: "DESELECT_ALL" });
        }
        return {
          type: "SUCCESS_RESULT",
          data: { deletedKeys: selectedRowIds },
        };
      }
      return {
        type: "ERROR_RESULT",
        errorMessage: `deleteSelectedRows: no active session table for viewport ${viewPortId}`,
      };
    }
    return {
      type: "ERROR_RESULT",
      errorMessage: "deleteSelectedRows: invalid rpc request",
    };
  };

  private undoRowChange: ServiceHandler = async (rpcRequest) => {
    if (isUndoRowChangeRpcRequest(rpcRequest)) {
      const { viewPortId } = rpcRequest.context;
      const { key } = rpcRequest.params;
      const sessionTable = this.getSessionTable(viewPortId, false);
      if (sessionTable) {
        const subscription = this.getSubscriptionByViewport(viewPortId);
        const { dataSource } = subscription;
        const sourceTableName =
          subscription.sourceTableName ?? dataSource.table?.table;
        const sourceTable = this.tables[sourceTableName as T];
        if (!sourceTable) {
          return {
            type: "ERROR_RESULT",
            errorMessage: `undoRowChange: source table not found for viewport ${viewPortId}`,
          };
        }
        const sessionRow = sessionTable.findByKey(key);
        if (!sessionRow) {
          return {
            type: "ERROR_RESULT",
            errorMessage: `undoRowChange: session row not found for key ${key}`,
          };
        }
        const action = sessionRow[sessionTable.map.vuuAction];
        if (action === "addRow") {
          sessionTable.delete(key);
          return { type: "SUCCESS_RESULT", data: undefined };
        }
        if (action === "deleteRow" || action === "editCell") {
          const sourceRow = sourceTable.findByKey(key);
          if (!sourceRow) {
            return {
              type: "ERROR_RESULT",
              errorMessage: `undoRowChange: source row not found for key ${key}`,
            };
          }
          const restoredRow = sessionRow.slice();
          for (const name of this.#copiedColumns(
            viewPortId,
            sessionTable,
            sourceTable,
          )) {
            restoredRow[sessionTable.map[name]] =
              sourceRow[sourceTable.map[name]];
          }
          sessionTable.updateRow(restoredRow);
          sessionTable.update(key, "vuuAction", "");
        }
        return { type: "SUCCESS_RESULT", data: undefined };
      }
      return {
        type: "ERROR_RESULT",
        errorMessage: `undoRowChange: no active session table for viewport ${viewPortId}`,
      };
    }
    return {
      type: "ERROR_RESULT",
      errorMessage: "undoRowChange: invalid rpc request",
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
    if (isEditCellRpcRequest(rpcRequest)) {
      const { viewPortId } = rpcRequest.context;
      const { column, data, key } = rpcRequest.params;
      const sessionTable = this.#sessionTableMap[viewPortId];
      let targetTable: Table | undefined = sessionTable;
      let sourceTableName: T | undefined =
        this.#sessionSourceTableMap[viewPortId];
      if (!targetTable) {
        const { dataSource } = this.getSubscriptionByViewport(viewPortId);
        if (dataSource.table) {
          sourceTableName = dataSource.table.table as T;
          targetTable = this.tables[sourceTableName];
        }
      }
      if (targetTable) {
        try {
          const sessionRow = sessionTable?.findByKey(key as string);
          if (
            sessionRow?.[sessionTable.map.vuuAction] === "deleteRow"
          ) {
            throw Error("editCell: cannot edit a deleted row");
          }
          assertUpdateIsValid(targetTable.schema, column as string, data);
          const validationError =
            sourceTableName === undefined
              ? undefined
              : this.validateEdit(sourceTableName, column as string, data);
          if (validationError !== undefined) {
            throw Error(validationError);
          }
          targetTable.update(key as string, column as string, data);
          if (
            sessionTable &&
            sessionTable.findByKey(key as string)?.[
            sessionTable.map.vuuAction
            ] !== "addRow"
          ) {
            sessionTable.update(key as string, "vuuAction", "editCell");
          }
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
      throw Error("[VuuModule] editCell invalid rpc type");
    }
  };

  private beginEditSessionMenuHandler: MenuServiceHandler = async ({
    rpcName,
    type,
    vpId,
  }) => {
    if (type === "VIEW_PORT_MENUS_SELECT_RPC") {

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

  /**
   * createSessionTable, as in Scala Vuu: creates an instance of the session
   * table blueprint named by `sessionTableName` (default
   * `<sessionType>-<sourceTable>`, see {@link sessionTableDefs}). There is
   * no fallback, the RPC fails if no blueprint has that name. Rows are
   * copied by column name. Returns the session table so the caller can
   * subscribe to it.
   */
  private createSessionTableService: ServiceHandler = async (rpcRequest) => {
    if (isCreateSessionTableRpcRequest(rpcRequest)) {
      const { viewPortId } = rpcRequest.context;
      const { sessionType, ...params } =
        rpcRequest.params as CreateSessionTableParams;
      if (!isSessionType(sessionType)) {
        return errorResult("Session type undefined");
      }
      try {
        const table = this.#createSession(viewPortId, sessionType, params);
        return { data: { table }, type: "SUCCESS_RESULT" };
      } catch (e) {
        return errorResult((e as Error).message);
      }
    }
    return errorResult("createSessionTable: invalid rpc request");
  };

  #createSession(
    viewPortId: string,
    sessionType: SessionType,
    {
      columnsToCopy,
      copyOption,
      sessionTableName,
    }: Omit<CreateSessionTableParams, "sessionType">,
  ): VuuTable {
    const subscription = this.getSubscriptionByViewport(viewPortId);
    const dataSource = subscription.dataSource as TickingArrayDataSource;
    const sourceTableName = dataSource.table?.table as T | undefined;
    const sourceTable =
      sourceTableName === undefined ? undefined : this.tables[sourceTableName];
    if (sourceTableName === undefined || sourceTable === undefined) {
      throw Error("createSessionTable: invalid rpc request");
    }
    if (
      sessionType !== "export" &&
      !this.editableTables?.includes(sourceTableName)
    ) {
      throw Error("Table not editable");
    }

    const defName =
      typeof sessionTableName === "string" && sessionTableName !== ""
        ? sessionTableName
        : `${sessionType}-${sourceTableName}`;
    const sessionTableDef = this.sessionTableDefs?.[defName];
    if (sessionTableDef === undefined) {
      throw Error(`session table ${defName} is not defined`);
    }

    const effectiveCopyOption = sessionType === "import" ? "Empty" : copyOption;
    if (!isCopyOption(effectiveCopyOption)) {
      throw Error("Missing or invalid copy option.");
    }
    const copiedColumns = this.#getColumnsToCopy(sourceTable, columnsToCopy);

    const name = `session-${uuid()}`;
    const schema = this.#sessionTableSchema(name, sessionTableDef);
    const sessionTable = new Table(
      schema,
      [],
      buildDataColumnMapFromSchema(schema),
    );

    const sourceRows: TableRow[] = [];
    if (effectiveCopyOption === "All") {
      sourceRows.push(...sourceTable.data.slice(0, this.maxSessionTableSize));
    } else if (effectiveCopyOption === "Selected") {
      for (const key of dataSource.getSelectedRowIds()) {
        if (sourceRows.length >= this.maxSessionTableSize) break;
        const row = sourceTable.findByKey(String(key));
        if (row) sourceRows.push(row);
      }
    }
    const { map } = sessionTable;
    const sourceKeyIndex = sourceTable.map[sourceTable.schema.key];
    for (const sourceRow of sourceRows) {
      const row: TableRow = new Array(schema.columns.length).fill("");
      for (const column of copiedColumns) {
        const index = map[column];
        if (index !== undefined) {
          row[index] = sourceRow[sourceTable.map[column]];
        }
      }
      // the session key column may have a different name to the source key
      row[map[schema.key]] = String(sourceRow[sourceKeyIndex]);
      sessionTable.insert(row);
    }

    this.#sessionInfo.set(name, {
      copiedColumns: new Set(copiedColumns),
      sessionTableDef,
    });
    this.#sessionTableMap[name] = sessionTable;
    this.#sessionSourceTableMap[name] = sourceTableName;
    subscription.sessionTableName = name;
    this.sessionTableChanged(sourceTableName, sessionTable);
    return { module: this.#name, table: name };
  }

  /**
   * Schema of a session table instance: the blueprint's columns plus the
   * session message column and vuuAction, if not defined.
   */
  #sessionTableSchema(
    sessionTableName: string,
    { columns, key }: SessionTableDef,
  ): TableSchema {
    const extraColumns = [this.#sessionTableMessageColumn, "vuuAction"]
      .filter((name) => !columns.some((column) => column.name === name))
      .map((name) => ({ name, serverDataType: "string" as const }));
    return {
      columns: columns.concat(extraColumns),
      key,
      table: { module: this.#name, table: sessionTableName },
    };
  }

  #getColumnsToCopy(sourceTable: Table, columnsToCopy?: string): string[] {
    const columns =
      typeof columnsToCopy !== "string" ||
      columnsToCopy.trim() === "" ||
      columnsToCopy.trim() === "*"
        ? sourceTable.schema.columns
            .map(({ name }) => name)
            .filter((name) => !DEFAULT_COLUMN_NAMES.has(name))
        : columnsToCopy.split(",").map((name) => name.trim());
    if (columns.some((name) => sourceTable.map[name] === undefined)) {
      throw Error("Column(s) not found in source table.");
    }
    return columns;
  }

  /**
   * Source columns held in a session table: for a session table created from
   * a blueprint, the copied columns the blueprint defines; for one created by
   * beginEditSession, every source column.
   */
  #copiedColumns(
    sessionTableName: string,
    sessionTable: Table,
    sourceTable: Table,
  ): string[] {
    const copiedColumns =
      this.#sessionInfo.get(sessionTableName)?.copiedColumns;
    return sourceTable.schema.columns
      .map(({ name }) => name)
      .filter(
        (name) =>
          sessionTable.map[name] !== undefined &&
          (copiedColumns === undefined || copiedColumns.has(name)),
      );
  }

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
              dataSource as TickingArrayDataSource,
            );
            this.#sessionTableMap[sessionTableName] = sessionTable;
            this.#sessionSourceTableMap[sessionTableName] = vuuTable.table as T;
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
      throw Error("[VuuModule] endEditSession invalid rpc type");
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
      const sessionTableName = subscription.sessionTableName ?? viewPortId;
      const sessionTable = this.#sessionTableMap[sessionTableName];
      if (!sessionTable) {
        return {
          type: "ERROR_RESULT",
          errorMessage: `addRow: no active session table for viewport ${viewPortId}`,
        };
      }
      const { data, key } = rpcRequest.params;
      const sourceTableName = this.#sessionSourceTableMap[sessionTableName];
      if (sourceTableName !== undefined) {
        for (const [column, value] of Object.entries(data)) {
          const validationError = this.validateEdit(
            sourceTableName,
            column,
            value,
          );
          if (validationError !== undefined) {
            return { type: "ERROR_RESULT", errorMessage: validationError };
          }
        }
      }
      const keyColumn = sessionTable.schema.key;
      let rowKey =
        data[keyColumn] ?? this.createRowKey(sourceTableName, data, key);
      let serverMessage: string | undefined;
      let rowData: Record<string, VuuRowDataItemType> = {
        ...data,
        [keyColumn]: rowKey,
      };

      const sourceTable =
        sourceTableName === undefined
          ? undefined
          : this.tables[sourceTableName];
      if (
        sessionTable.findByKey(String(rowKey)) !== undefined ||
        sourceTable?.findByKey(String(rowKey)) !== undefined
      ) {
        serverMessage = this.duplicateKeyMessage(
          sourceTableName,
          String(rowKey),
          data,
        );
        if (sessionTable.map.vuuRowNum === undefined) {
          return { type: "ERROR_RESULT", errorMessage: serverMessage };
        }
        // An import session keeps the row, flagged with vuuMsg, so the
        // error is reported against its line in the file.
        rowKey = uuid();
        rowData = {
          ...data,
          [keyColumn]: rowKey,
          [this.#sessionTableMessageColumn]: serverMessage,
        };
      }

      const columnMap = sessionTable.map;
      const columnCount = Object.keys(columnMap).length;
      const row: VuuDataRow = new Array(columnCount).fill("");
      row[columnMap.vuuAction] = "addRow";
      for (const [col, idx] of Object.entries(columnMap)) {
        if (rowData[col] !== undefined) {
          row[idx] = rowData[col];
        }
      }
      sessionTable.insert(row);
      return {
        type: "SUCCESS_RESULT",
        data:
          serverMessage === undefined
            ? { key: rowKey }
            : { key: rowKey, vuuMsg: serverMessage },
      };
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
        const sourceTableName =
          subscription.sourceTableName ?? dataSource.table.table;
        const sourceTable = this.tables[sourceTableName as T];

        if (rpcRequest.params.save === true) {
          let rejectedCount = 0;
          const vuuMsgIdx = sessionTable.map[this.#sessionTableMessageColumn];
          const actionIdx = sessionTable.map.vuuAction;
          const sessionTimestampIdx = sessionTable.map.vuuUpdatedTimestamp;
          const sourceTimestampIdx = sourceTable.map.vuuUpdatedTimestamp;
          const copiedColumns = this.#copiedColumns(
            sessionTableName,
            sessionTable,
            sourceTable,
          );
          const sessionKeyIdx = sessionTable.map[sessionTable.schema.key];
          for (let i = 0; i < sessionTable.data.length; i++) {
            const sessionRow = sessionTable.data[i];
            const key = String(sessionRow[sessionKeyIdx]);
            const currentRow = sourceTable.findByKey(key);
            const action = sessionRow[actionIdx];
            if (action === "deleteRow") {
              if (currentRow) {
                const sessionTimestamp = sessionRow[sessionTimestampIdx];
                const sourceTimestamp = currentRow[sourceTimestampIdx];
                if (
                  typeof sessionTimestamp === "number" &&
                  typeof sourceTimestamp === "number" &&
                  sourceTimestamp > sessionTimestamp
                ) {
                  rejectedCount += 1;
                  sessionTable.update(
                    key,
                    this.#sessionTableMessageColumn,
                    "stale delete",
                  );
                } else {
                  sourceTable.delete(key);
                }
              }
              continue;
            }
            if (sessionRow[vuuMsgIdx]) continue;
            if (action === "editCell" && currentRow) {
              for (const name of copiedColumns) {
                const value = sessionRow[sessionTable.map[name]];
                if (currentRow[sourceTable.map[name]] !== value) {
                  sourceTable.update(key, name, value);
                }
              }
            } else if (action === "addRow" && !currentRow) {
              // source columns the session table does not have are blank
              sourceTable.insert(
                sourceTable.schema.columns.map(({ name }) => {
                  if (name === sourceTable.schema.key) return key;
                  const index = sessionTable.map[name];
                  return index === undefined ? "" : sessionRow[index];
                }),
              );
            }
          }
          if (rejectedCount > 0) {
            return {
              errorMessage: "stale update",
              type: "ERROR_RESULT",
            };
          }
          return {
            type: "SUCCESS_RESULT",
            data: undefined,
          };
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
      throw Error("[VuuModule] endEditSession invalid rpc type");
    }

    // return {
    //   type: "ERROR_RESULT",
    //   errorMessage: "not implemented yet",
    // };
  };

  /**
   * Sets one column to one value on every row of a session table, as an
   * editCell on each row: the value is validated first, and nothing changes
   * if it is rejected. Rows marked deleteRow, and rows that already have the
   * value, are left alone. Each row that changes is marked editCell, unless
   * it was added in the session.
   */
  private applyBulkEdits: ServiceHandler = async (rpcRequest) => {
    if (rpcRequest.context.type === "VIEWPORT_CONTEXT") {
      const { viewPortId } = rpcRequest.context;
      const sessionTable = this.getSessionTable(viewPortId);
      const { column, value } = rpcRequest.params as {
        column: string;
        value: VuuRowDataItemType;
      };
      try {
        assertUpdateIsValid(sessionTable.schema, column, value);
      } catch (e) {
        return errorResult((e as Error).message);
      }
      const sourceTableName = this.#sessionSourceTableMap[viewPortId];
      const validationError =
        sourceTableName === undefined
          ? undefined
          : this.validateEdit(sourceTableName, column, value);
      if (validationError !== undefined) {
        return errorResult(validationError);
      }
      const { map } = sessionTable;
      const keyIndex = map[sessionTable.schema.key];
      const changedRows = sessionTable.data.filter(
        (row) =>
          row[map.vuuAction] !== "deleteRow" && row[map[column]] !== value,
      );
      for (const row of changedRows) {
        const key = String(row[keyIndex]);
        const action = row[map.vuuAction];
        sessionTable.update(key, column, value);
        if (action !== "addRow") {
          sessionTable.update(key, "vuuAction", "editCell");
        }
      }
      return {
        type: "SUCCESS_RESULT",
        data: undefined,
      };
    } else {
      throw Error("[VuuModule] applyBulkEdits invalid rpc type");
    }
  };

  protected createSessionTable(
    sourceTable: Table,
    sessionTableName: string,
    editSessionMode: EditSessionMode | CopyOption,
    dataSource: TickingArrayDataSource,
    sessionType?: SessionType,
  ) {
    if (editSessionMode === "All" || editSessionMode.endsWith("all-rows")) {
      return this.createSessionTableWithAllRows(sourceTable, sessionTableName);
    } else if (
      editSessionMode === "Selected" ||
      editSessionMode === "selected-rows"
    ) {
      return this.createSessionTableFromSelectedRows(
        sourceTable,
        sessionTableName,
        dataSource,
      );
    } else if (
      editSessionMode === "Empty" ||
      editSessionMode === "empty-session-table"
    ) {
      return this.createEmptySessionTable(sourceTable, sessionTableName, sessionType);
    } else {
      throw Error(
        `[VuuModule] createSessionTable, invalid editSessionMode ${editSessionMode}`,
      );
    }
  }

  protected createSessionTableWithAllRows(
    { data, schema }: Table,
    _sessionTableName: string,
  ) {
    const sessionSchema = sessionTableSchema(schema);
    return new Table(
      sessionSchema,
      data.map((row) => sessionTableRow(row, schema)),
      buildDataColumnMapFromSchema(sessionSchema),
    );
  }

  protected createEmptySessionTable(
    { schema }: Table,
    sessionTableName: string,
    sessionType?: SessionType,
  ) {
    // Override schema.table.table so isSessionTable() returns true for this session.
    // sessionTableSchema adds the vuuMsg column, consistent with all other session tables.
    const sessionSchema = sessionTableSchema({
      ...schema,
      table: { ...schema.table, table: sessionTableName },
    });
    if (sessionType === "import") {
      (sessionSchema.columns as { name: string; serverDataType: string }[]).push(
        { name: "vuuRowNum", serverDataType: "int" },
      );
    }
    return new Table(
      sessionSchema,
      [],
      buildDataColumnMapFromSchema(sessionSchema),
    );
  }

  protected createSessionTableFromSelectedRows(
    { data, map, schema }: Table,
    sessionTableName: string,
    dataSource: TickingArrayDataSource,
  ) {
    const selectedRowIds = dataSource.getSelectedRowIds();
    const keyIndex = map[schema.key];
    const sessionData: Array<Array<bigint | VuuRowDataItemType>> = [];
    for (let i = 0; i < selectedRowIds.length; i++) {
      for (let j = 0; j < data.length; j++) {
        if (data[j][keyIndex] === selectedRowIds[i]) {
          sessionData.push(sessionTableRow(data[j], schema));
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
      rpcName: "createSessionTable",
      service: this.createSessionTableService,
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
      rpcName: "deleteSelectedRows",
      service: this.deleteSelectedRows,
    },
    {
      rpcName: "endEditSession",
      service: this.endEditSession,
    },
    {
      rpcName: "editCell",
      service: this.editCell,
    },
    {
      rpcName: "undoRowChange",
      service: this.undoRowChange,
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
