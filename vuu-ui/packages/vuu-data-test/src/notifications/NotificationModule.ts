import type { SchemaColumn, TableSchema } from "@vuu-ui/vuu-data-types";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { type RpcService, VuuModule } from "../core/module/VuuModule";
import type { PermissionFunction } from "../core/filter/PermissionFilter";
import tableContainer from "../core/table/TableContainer";
import { buildDataColumnMapFromSchema, type Table } from "../Table";
import {
  type ColumnDefinition,
  NotificationsSchema,
} from "./NotificationsSchema";

export type NotificationsTableName = "notifications";

/**
 * Source of notifications. Started when the first dataSource is
 * created for the notifications table, or explicitly via module.start().
 */
export interface NotificationsProvider {
  start: () => void;
  stop: () => void;
}

export type NotificationsProviderFactory = (
  table: Table,
) => NotificationsProvider;

/**
 * A notification to publish. Values are keyed by column name; columns not
 * supplied are defaulted. `expiryTime` (epoch ms) schedules deletion of the row.
 */
export interface NotificationInput {
  id?: string;
  type?: string;
  expiryTime?: number;
  title?: string;
  message?: string;
  level?: string;
  audience?: string;
  [columnName: string]: VuuRowDataItemType | undefined;
}

export type NotificationsServiceFactory = (
  table: Table,
  module: NotificationModule,
) => RpcService[];

const NAME = "NOTIFICATIONS";
const TABLE_NAME: NotificationsTableName = "notifications";

const DEFAULT_RANGE_LIMITS = {
  maxRangeEnd: 1_000_000,
  maxRangeWidth: 1_000,
};

const VUU_DEFAULT_COLUMNS: SchemaColumn[] = [
  { name: "vuuCreatedTimestamp", serverDataType: "epochtimestamp" },
  { name: "vuuUpdatedTimestamp", serverDataType: "epochtimestamp" },
  { name: "vuuMsg", serverDataType: "string" },
];

/**
 * A generic Notifications module, exposing a single 'notifications' table.
 * The source of notifications (provider), the rows visible to each user
 * (permissionFunction) and any rpc services (serviceFactory) are supplied
 * by the consumer. Any additional columns are appended to the generic
 * notification columns (see NotificationsSchema).
 */
export class NotificationModule extends VuuModule<NotificationsTableName> {
  static readonly NAME = NAME;
  static readonly TABLE_NAME = TABLE_NAME;

  #autoStarted = false;
  #expiryTimers = new Map<string, ReturnType<typeof setTimeout>>();
  #provider: NotificationsProvider;
  #running = false;
  #schemas: Record<NotificationsTableName, TableSchema>;
  #services: Record<NotificationsTableName, RpcService[]>;
  #tables: Record<NotificationsTableName, Table>;

  constructor(
    providerFactory: NotificationsProviderFactory,
    permissionFunction: PermissionFunction,
    serviceFactory: NotificationsServiceFactory,
    ...additionalColumns: ColumnDefinition[]
  ) {
    super(NAME);

    const schema: TableSchema = {
      columns: [
        ...NotificationsSchema.allFrom(...additionalColumns),
        ...VUU_DEFAULT_COLUMNS,
      ],
      key: "id",
      rangeLimits: DEFAULT_RANGE_LIMITS,
      table: { module: NAME, table: TABLE_NAME },
    };
    const table = tableContainer.createTable(
      schema,
      [],
      buildDataColumnMapFromSchema(schema),
    );

    this.#schemas = { [TABLE_NAME]: schema };
    this.#tables = { [TABLE_NAME]: table };
    this.permissionFunctions = { [TABLE_NAME]: permissionFunction };
    this.#provider = providerFactory(table);
    this.#services = { [TABLE_NAME]: serviceFactory(table, this) };
  }

  protected beforeCreateDataSource() {
    // Only auto-start once, so a provider stopped explicitly stays stopped.
    if (!this.#autoStarted) {
      this.#autoStarted = true;
      this.start();
    }
  }

  /**
   * Inserts a notification row, as a server-side publisher would. Defaults:
   * a random `id`, `type` "toast", `level` "INFO", `audience` "all" and
   * empty strings for other string columns. Returns the row id.
   */
  publish(notification: NotificationInput = {}): string {
    const table = this.#tables[TABLE_NAME];
    const { map, schema } = table;
    const id = notification.id ?? crypto.randomUUID();
    const values: NotificationInput = {
      type: "toast",
      title: "Notification",
      message: "",
      level: "INFO",
      audience: "all",
      ...notification,
      id,
    };
    const row: VuuRowDataItemType[] = schema.columns.map(
      ({ serverDataType }) =>
        serverDataType === "string"
          ? ""
          : serverDataType === "boolean"
            ? false
            : 0,
    );
    for (const [name, value] of Object.entries(values)) {
      const idx = map[name];
      if (idx !== undefined && value !== undefined) {
        row[idx] = value;
      }
    }
    const existingRow = table.findByKey(id);
    if (existingRow) {
      row[map.vuuCreatedTimestamp] = existingRow[
        map.vuuCreatedTimestamp
      ] as VuuRowDataItemType;
      table.updateRow(row);
    } else {
      table.insert(row);
    }

    clearTimeout(this.#expiryTimers.get(id));
    this.#expiryTimers.delete(id);
    const { expiryTime } = values;
    if (typeof expiryTime === "number" && expiryTime > 0) {
      this.#expiryTimers.set(
        id,
        setTimeout(
          () => {
            this.#expiryTimers.delete(id);
            if (table.findByKey(id)) {
              table.delete(id);
            }
          },
          Math.max(0, expiryTime - Date.now()),
        ),
      );
    }
    return id;
  }

  get isRunning() {
    return this.#running;
  }

  start() {
    if (!this.#running) {
      this.#running = true;
      this.#provider.start();
    }
  }

  stop() {
    this.#autoStarted = true;
    if (this.#running) {
      this.#running = false;
      this.#provider.stop();
    }
  }

  get menus() {
    return undefined;
  }

  get menuServices() {
    return undefined;
  }

  get schemas() {
    return this.#schemas;
  }

  get services() {
    return this.#services;
  }

  get tables() {
    return this.#tables;
  }

  get visualLinks() {
    return undefined;
  }
}
