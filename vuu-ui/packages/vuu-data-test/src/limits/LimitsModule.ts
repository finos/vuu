import type { TableSchema } from "@vuu-ui/vuu-data-types";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { type RpcMenuService, VuuModule } from "../core/module/VuuModule";
import tableContainer from "../core/table/TableContainer";
import { VUU_DEFAULT_COLUMNS } from "../default-column-definitions";
import { buildDataColumnMap, type Table } from "../Table";

export type LimitsTableName = "traderLimits";

export type LimitType = "Volume over time" | "Cumulative %";
/** The limit types supported for now. */
export const LIMIT_TYPES: readonly LimitType[] = ["Volume over time"];

export const LIMIT_PRODUCTS = ["PROD1"] as const;
/** Seconds. Fixed for now. */
export const LIMIT_TIME_DURATION = 600;

export type LimitStatus = "Pending" | "Active";

export const TRADER_LIMITS_TABLE = {
  module: "LIMITS",
  table: "traderLimits",
} as const;

export const limitsSchemas: Record<LimitsTableName, TableSchema> = {
  traderLimits: {
    columns: [
      { name: "status", serverDataType: "string" },
      { name: "limit_key", serverDataType: "string" },
      { name: "trader_id", serverDataType: "string" },
      { name: "limit_id", serverDataType: "string" },
      { name: "product_id", serverDataType: "string" },
      { name: "limit_type", serverDataType: "string" },
      { name: "limit", serverDataType: "long" },
      { name: "time_duration", serverDataType: "int" },
      { name: "change", serverDataType: "string" },
      ...VUU_DEFAULT_COLUMNS,
    ],
    key: "limit_key",
    table: TRADER_LIMITS_TABLE,
  },
};

/**
 * Server-side rules for trader limits, applied to cell edits and added rows.
 */
export const validateTraderLimit = (
  column: string,
  value: VuuRowDataItemType,
): string | undefined => {
  switch (column) {
    case "limit_id":
      return typeof value === "string" && value.trim() !== ""
        ? undefined
        : "limit_id is required";
    case "trader_id":
      return typeof value === "string" && value.trim() !== ""
        ? undefined
        : "trader_id is required";
    case "product_id":
      return (LIMIT_PRODUCTS as readonly string[]).includes(String(value))
        ? undefined
        : `product_id must be ${LIMIT_PRODUCTS.join(" or ")}`;
    case "limit_type":
      return (LIMIT_TYPES as readonly unknown[]).includes(value)
        ? undefined
        : `limit_type must be '${LIMIT_TYPES.join("' or '")}'`;
    case "limit": {
      const limit = Number(value);
      return Number.isInteger(limit) && limit > 0
        ? undefined
        : "limit must be a whole number greater than zero";
    }
    case "time_duration":
      return Number(value) === LIMIT_TIME_DURATION
        ? undefined
        : `time_duration must be ${LIMIT_TIME_DURATION}`;
    default:
      return undefined;
  }
};

/**
 * The key of a trader limit. limit_id is unique within a trader.
 */
export const traderLimitKey = (limitId: string, traderId: string) =>
  `${limitId}:${traderId}`;

export const LIMIT_ADDED = "Added";
type LimitValue = VuuRowDataItemType | bigint;

export const limitChangedMessage = (limit: LimitValue) =>
  `Limit changed to ${limit}`;

/**
 * Trader limits, keyed by limit_key, which the server builds from limit_id
 * and trader_id. A new limit, or a change to an existing limit, is Pending
 * until the next business day, when it becomes Active. Call
 * `activatePendingLimits` to simulate the start of the next business day.
 *
 * `limit` is the Active limit. A change to the limit of an Active row is
 * held until the next business day and described in `change`. A new row's
 * `change` is "Added"; its limit can be changed until it becomes Active.
 */
class LimitsModule extends VuuModule<LimitsTableName> {
  /** The limit of each row that has become Active, by key. */
  #activeLimits = new Map<string, LimitValue>();
  /** Changed limits of Active rows, applied on the next business day. */
  #pendingLimits = new Map<string, LimitValue>();

  #tables: Record<LimitsTableName, Table> = {
    traderLimits: tableContainer.createTable(
      limitsSchemas.traderLimits,
      [],
      buildDataColumnMap(limitsSchemas, "traderLimits"),
    ),
  };

  constructor() {
    super("LIMITS");
    const table = this.#tables.traderLimits;
    const { map } = table;
    // These listeners are registered before any data source subscribes, so
    // they run first. They set values on the emitted row, which is the row
    // the table holds, so subscribers receive the row with them already set.
    table.on("insert", (row) => {
      const now = Date.now();
      row[map.status] = "Pending";
      row[map.change] = LIMIT_ADDED;
      row[map.vuuCreatedTimestamp] = now;
      row[map.vuuUpdatedTimestamp] = now;
    });
    table.on("update", (row, columnName) => {
      const key = String(row[map.limit_key]);
      const activeLimit = this.#activeLimits.get(key);
      if (columnName !== "limit" || activeLimit === undefined) {
        return;
      }
      const limit = row[map.limit];
      row[map.limit] = activeLimit;
      if (Number(limit) === Number(activeLimit)) {
        this.#pendingLimits.delete(key);
        row[map.status] = "Active";
        row[map.change] = "";
      } else {
        this.#pendingLimits.set(key, limit);
        row[map.status] = "Pending";
        row[map.change] = limitChangedMessage(limit);
      }
    });
    table.on("delete", (key) => {
      this.#activeLimits.delete(key);
      this.#pendingLimits.delete(key);
    });
  }

  /** Simulates the start of the next business day. */
  activatePendingLimits() {
    const table = this.#tables.traderLimits;
    const { map } = table;
    table.data
      .filter((row) => row[map.status] === "Pending")
      .forEach((row) => {
        const key = String(row[map.limit_key]);
        const activeRow = row.slice();
        if (this.#pendingLimits.has(key)) {
          activeRow[map.limit] = this.#pendingLimits.get(key) ?? row[map.limit];
          this.#pendingLimits.delete(key);
        }
        activeRow[map.status] = "Active";
        activeRow[map.change] = "";
        this.#activeLimits.set(key, activeRow[map.limit]);
        table.updateRow(activeRow);
      });
  }

  get menus() {
    return undefined;
  }
  get services() {
    return undefined;
  }
  get menuServices():
    | Record<LimitsTableName, RpcMenuService[] | undefined>
    | undefined {
    return undefined;
  }
  get schemas() {
    return limitsSchemas;
  }
  get tables() {
    return this.#tables;
  }
  get visualLinks() {
    return undefined;
  }

  protected createRowKey(
    tableName: LimitsTableName | undefined,
    data: Record<string, VuuRowDataItemType>,
    key?: string,
  ) {
    const { limit_id, trader_id } = data;
    return typeof limit_id === "string" && typeof trader_id === "string"
      ? traderLimitKey(limit_id, trader_id)
      : super.createRowKey(tableName, data, key);
  }

  protected duplicateKeyMessage(
    _tableName: LimitsTableName | undefined,
    _key: string,
    { limit_id, trader_id }: Record<string, VuuRowDataItemType>,
  ) {
    return `Trader ${trader_id} already has a limit with limit_id ${limit_id}`;
  }

  protected validateEdit(
    _tableName: LimitsTableName,
    column: string,
    value: VuuRowDataItemType,
  ) {
    return validateTraderLimit(column, value);
  }
}

export const limitsModule = new LimitsModule();
