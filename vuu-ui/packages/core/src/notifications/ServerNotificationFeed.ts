import type {
  DataSource,
  DataSourceCallbackMessage,
  DataSourceRow,
  ServerAPI,
} from "@vuu-ui/vuu-data-types";
import { metadataKeys, Range } from "@vuu-ui/vuu-utils";
import type { DataSourceConstructor } from "../context-definitions/DataContext";
import {
  NOTIFICATIONS_TABLE,
  type ServerNotificationRow,
} from "./notification-row-mapping";

const { count: METADATA_COUNT, IDX, KEY } = metadataKeys;

/** How a feed reaches a server: its server API and data source class. */
export interface NotificationFeedScope {
  getServerAPI: () => Promise<
    Pick<ServerAPI, "getTableList" | "getTableSchema">
  >;
  VuuDataSource: DataSourceConstructor;
}

export interface NotificationFeedSink {
  upsert(row: ServerNotificationRow, initial: boolean): void;
  /** The server deleted the row with this key. */
  expire(connectionId: string, rowKey: string): void;
}

export type NotificationFeedStatus =
  "starting" | "subscribed" | "unsupported" | "failed" | "disposed";

export interface ServerNotificationFeedProps {
  connectionId: string;
  /** Rows after the first update within this window are not `initial`. */
  initialWindowMs?: number;
  maxRows?: number;
  now?: () => number;
  /**
   * Rows missing for this long are treated as deleted. Allows for updates
   * that shift rows arriving in more than one message.
   */
  removalDelayMs?: number;
  scope: NotificationFeedScope;
  sink: NotificationFeedSink;
}

/**
 * Subscribes to one server's `NOTIFICATIONS/notifications` table, newest
 * first, and passes inserted, updated and deleted rows to the sink. Servers
 * without the table are left alone.
 */
export class ServerNotificationFeed {
  readonly connectionId: string;
  readonly #initialWindowMs: number;
  readonly #keysByIndex: (string | undefined)[] = [];
  readonly #maxRows: number;
  readonly #now: () => number;
  readonly #removalDelayMs: number;
  readonly #scope: NotificationFeedScope;
  readonly #signatures = new Map<string, string>();
  readonly #sink: NotificationFeedSink;
  #columns: string[] = [];
  #dataSource: DataSource | undefined;
  #initialUntil: number | undefined;
  #removalTimer: ReturnType<typeof setTimeout> | undefined;
  #size = 0;
  #status: NotificationFeedStatus = "starting";

  constructor({
    connectionId,
    initialWindowMs = 500,
    maxRows = 200,
    now = Date.now,
    removalDelayMs = 50,
    scope,
    sink,
  }: ServerNotificationFeedProps) {
    this.connectionId = connectionId;
    this.#initialWindowMs = initialWindowMs;
    this.#maxRows = maxRows;
    this.#now = now;
    this.#removalDelayMs = removalDelayMs;
    this.#scope = scope;
    this.#sink = sink;
  }

  get status() {
    return this.#status;
  }

  // A getter, so the checks after each await aren't narrowed away.
  get #disposed() {
    return this.#status === "disposed";
  }

  async start() {
    try {
      const serverAPI = await this.#scope.getServerAPI();
      if (this.#disposed) return;
      const { tables } = await serverAPI.getTableList();
      if (this.#disposed) return;
      const supported = tables.some(
        ({ module, table }) =>
          module === NOTIFICATIONS_TABLE.module &&
          table === NOTIFICATIONS_TABLE.table,
      );
      if (!supported) {
        this.#status = "unsupported";
        return;
      }
      const schema = await serverAPI.getTableSchema({
        ...NOTIFICATIONS_TABLE,
      });
      if (this.#disposed) return;
      this.#columns = schema.columns.map(({ name }) => name);
      const dataSource = new this.#scope.VuuDataSource({
        columns: this.#columns,
        sort: this.#columns.includes("vuuCreatedTimestamp")
          ? { sortDefs: [{ column: "vuuCreatedTimestamp", sortType: "D" }] }
          : undefined,
        table: { ...NOTIFICATIONS_TABLE },
        title: "Portal notifications",
      });
      this.#dataSource = dataSource;
      await dataSource.subscribe(
        { range: Range(0, this.#maxRows) },
        this.#handleMessage,
      );
      if (this.#disposed) {
        dataSource.unsubscribe();
      } else {
        this.#status = "subscribed";
      }
    } catch (error) {
      if (this.#status !== "disposed") {
        this.#status = "failed";
        console.warn(
          `[ServerNotificationFeed] ${this.connectionId}: ${String(error)}`,
        );
      }
    }
  }

  dispose() {
    if (this.#disposed) return;
    this.#status = "disposed";
    clearTimeout(this.#removalTimer);
    try {
      this.#dataSource?.unsubscribe();
    } catch (error) {
      console.warn(
        `[ServerNotificationFeed] ${this.connectionId}: ${String(error)}`,
      );
    }
    this.#dataSource = undefined;
  }

  #handleMessage = (message: DataSourceCallbackMessage) => {
    if (this.#status === "disposed" || message.type !== "viewport-update") {
      return;
    }
    const now = this.#now();
    this.#initialUntil ??= now + this.#initialWindowMs;
    const initial = now <= this.#initialUntil;
    const { rows, size } = message;
    if (size !== undefined) {
      this.#size = size;
      if (this.#keysByIndex.length > size) {
        this.#keysByIndex.length = size;
      }
    }
    for (const row of rows ?? []) {
      this.#applyRow(row, initial);
    }
    this.#scheduleRemovalCheck();
  };

  #applyRow(row: DataSourceRow, initial: boolean) {
    const rowKey = String(row[KEY]);
    this.#keysByIndex[row[IDX] as number] = rowKey;
    const values: Record<string, unknown> = {};
    this.#columns.forEach((name, i) => {
      values[name] = row[METADATA_COUNT + i];
    });
    // Rows are resent when their index shifts; only pass on real changes.
    const signature = JSON.stringify(values);
    if (this.#signatures.get(rowKey) !== signature) {
      this.#signatures.set(rowKey, signature);
      this.#sink.upsert(
        { connectionId: this.connectionId, rowKey, values },
        initial,
      );
    }
  }

  #scheduleRemovalCheck() {
    if (this.#removalTimer !== undefined) return;
    this.#removalTimer = setTimeout(() => {
      this.#removalTimer = undefined;
      if (this.#disposed) return;
      const present = new Set(this.#keysByIndex.filter((key) => key));
      for (const rowKey of [...this.#signatures.keys()]) {
        if (!present.has(rowKey)) {
          this.#signatures.delete(rowKey);
          // With a full window, a missing row may just have been pushed out
          // of range by newer ones, so only a smaller table means deleted.
          if (this.#size < this.#maxRows) {
            this.#sink.expire(this.connectionId, rowKey);
          }
        }
      }
    }, this.#removalDelayMs);
  }
}
