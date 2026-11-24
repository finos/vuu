import type { SchemaColumn, TableSchema } from "@vuu-ui/vuu-data-types";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import {
  type RpcMenuService,
  type RpcService,
  type ServiceHandler,
  type SessionTableDef,
  VuuModule,
} from "../core/module/VuuModule";
import tableContainer from "../core/table/TableContainer";
import { VUU_DEFAULT_COLUMNS } from "../default-column-definitions";
import { buildDataColumnMap, type Table } from "../Table";

export type LimitsTableName = "limitDefinitions";

export const LIMIT_DEFINITIONS_TABLE = {
  module: "LIMITS",
  table: "limitDefinitions",
} as const;

export type LimitEntityType =
  | "Firm"
  | "Legal entity"
  | "Desk"
  | "Book"
  | "Trader";

export interface LimitEntity {
  entity_id: string;
  entity_type: LimitEntityType;
  name: string;
}

/** The entities limits attach to. A hierarchy table will replace this. */
export const LIMIT_ENTITIES: readonly LimitEntity[] = [
  { entity_id: "FIRM", entity_type: "Firm", name: "Firm" },
  { entity_id: "LE-UK", entity_type: "Legal entity", name: "UK Ltd" },
  { entity_id: "LE-US", entity_type: "Legal entity", name: "US Inc" },
  { entity_id: "DESK-EQD", entity_type: "Desk", name: "Equity derivatives" },
  { entity_id: "DESK-CASH", entity_type: "Desk", name: "Cash equities" },
  { entity_id: "DESK-RATES", entity_type: "Desk", name: "Rates" },
  { entity_id: "BOOK-EQD-01", entity_type: "Book", name: "Index options" },
  {
    entity_id: "BOOK-EQD-02",
    entity_type: "Book",
    name: "Single stock options",
  },
  { entity_id: "BOOK-CASH-01", entity_type: "Book", name: "UK cash" },
  { entity_id: "BOOK-RATES-01", entity_type: "Book", name: "Govt bonds" },
  { entity_id: "TRD-JSMITH", entity_type: "Trader", name: "J Smith" },
  { entity_id: "TRD-AKHAN", entity_type: "Trader", name: "A Khan" },
];

export type LimitPeriod =
  | "Per order"
  | "Per second"
  | "Intraday"
  | "Overnight"
  | "Daily"
  | "MTD"
  | "YTD";

export const LIMIT_PERIODS: readonly LimitPeriod[] = [
  "Per order",
  "Per second",
  "Intraday",
  "Overnight",
  "Daily",
  "MTD",
  "YTD",
];

export type LimitMetricFamily =
  | "Order"
  | "Throughput"
  | "Position"
  | "Sensitivity"
  | "Portfolio risk"
  | "P&L stop-loss"
  | "Credit";

interface LimitMetric {
  family: LimitMetricFamily;
  periods: readonly LimitPeriod[];
}

const metrics = (
  family: LimitMetricFamily,
  periods: readonly LimitPeriod[],
  names: string[],
): [string, LimitMetric][] => names.map((name) => [name, { family, periods }]);

/** The metrics a limit can be defined on, with the periods each allows. */
export const LIMIT_METRICS: Readonly<Record<string, LimitMetric>> =
  Object.fromEntries([
    ...metrics(
      "Order",
      ["Per order"],
      [
        "Max order quantity",
        "Max order notional",
        "Price collar %",
        "Max % of ADV",
      ],
    ),
    ...metrics(
      "Throughput",
      ["Per second", "Daily"],
      ["Orders per second", "Messages per second", "Order-to-trade ratio"],
    ),
    ...metrics(
      "Position",
      ["Intraday", "Overnight"],
      ["Gross position", "Net position", "Long notional", "Short notional"],
    ),
    ...metrics(
      "Sensitivity",
      ["Intraday", "Overnight"],
      ["Delta", "Gamma", "Vega", "DV01"],
    ),
    ...metrics("Portfolio risk", ["Daily"], ["VaR", "Stress loss"]),
    ...metrics("P&L stop-loss", ["Daily", "MTD", "YTD"], ["Drawdown"]),
    ...metrics("Credit", ["Daily"], ["Counterparty PFE", "Settlement limit"]),
  ]);

export const LIMIT_METRIC_NAMES = Object.keys(LIMIT_METRICS);

export const LIMIT_CURRENCIES = ["USD", "EUR", "GBP", "JPY"] as const;

export type LimitStatus = "Pending" | "Active";

/** The user who makes every change. The local module has no user identity. */
export const LIMITS_USER = "trader";

const insertOnly = { editable: { insert: true, update: false } } as const;
const readOnly = { editable: false } as const;

/** Columns of a limit that the user enters. */
const definitionColumns: SchemaColumn[] = [
  { name: "entity_id", serverDataType: "string", ...insertOnly },
  { name: "metric", serverDataType: "string", ...insertOnly },
  { name: "scope", serverDataType: "string", ...insertOnly },
  { name: "period", serverDataType: "string", ...insertOnly },
  { name: "warning", serverDataType: "double" },
  { name: "soft", serverDataType: "double" },
  { name: "hard", serverDataType: "double" },
  { name: "currency", serverDataType: "string" },
  { name: "effective_from", serverDataType: "epochtimestamp" },
  { name: "effective_to", serverDataType: "epochtimestamp" },
  { name: "owner", serverDataType: "string" },
];

/** Columns of a limit, in CSV template order, that are entered by the user. */
export const LIMIT_DEFINITION_COLUMNS = definitionColumns.map(
  ({ name }) => name,
);

/** Columns a limit must have. The others may be blank. */
export const LIMIT_REQUIRED_COLUMNS: readonly string[] = [
  "entity_id",
  "metric",
  "period",
  "hard",
];

const limitKeyColumn: SchemaColumn = {
  name: "limit_key",
  serverDataType: "string",
  ...readOnly,
};

export const limitsSchemas: Record<LimitsTableName, TableSchema> = {
  limitDefinitions: {
    columns: [
      limitKeyColumn,
      { name: "status", serverDataType: "string" },
      { name: "entity_type", serverDataType: "string" },
      { name: "metric_family", serverDataType: "string" },
      ...definitionColumns,
      { name: "change", serverDataType: "string" },
      { name: "changed_by", serverDataType: "string" },
      ...VUU_DEFAULT_COLUMNS,
    ],
    key: "limit_key",
    table: LIMIT_DEFINITIONS_TABLE,
  },
};

const isBlank = (value: unknown) =>
  value === undefined || value === null || value === "";

const isNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value);

/**
 * Rules for a single value, applied to cell edits, added rows and imported
 * CSV values. A blank value is accepted: required columns, and rules across
 * columns, are checked when changes are saved, see
 * {@link validateLimitDefinition}.
 */
export const validateLimitValue = (
  column: string,
  value: VuuRowDataItemType,
): string | undefined => {
  if (isBlank(value)) {
    return undefined;
  }
  switch (column) {
    case "entity_id":
      return LIMIT_ENTITIES.some(({ entity_id }) => entity_id === value)
        ? undefined
        : `entity ${value} is not known`;
    case "metric":
      return LIMIT_METRIC_NAMES.includes(String(value))
        ? undefined
        : `metric ${value} is not known`;
    case "period":
      return (LIMIT_PERIODS as readonly unknown[]).includes(value)
        ? undefined
        : `period must be one of ${LIMIT_PERIODS.join(", ")}`;
    case "warning":
    case "soft":
    case "hard":
      return isNumber(value) && Number(value) > 0
        ? undefined
        : `${column} must be a number greater than zero`;
    case "currency":
      return (LIMIT_CURRENCIES as readonly unknown[]).includes(value)
        ? undefined
        : `currency must be one of ${LIMIT_CURRENCIES.join(", ")}`;
    default:
      return undefined;
  }
};

/**
 * Rules for a whole limit, applied when changes are saved. Returns the
 * first error found.
 */
export const validateLimitDefinition = (
  limit: Record<string, VuuRowDataItemType>,
): string | undefined => {
  for (const column of LIMIT_REQUIRED_COLUMNS) {
    if (isBlank(limit[column])) {
      return `${column} is required`;
    }
  }
  for (const column of LIMIT_DEFINITION_COLUMNS) {
    const error = validateLimitValue(column, limit[column]);
    if (error) return error;
  }
  const { effective_from, effective_to, hard, metric, period, soft, warning } =
    limit;
  if (!LIMIT_METRICS[String(metric)].periods.includes(period as LimitPeriod)) {
    return `period of ${metric} must be ${LIMIT_METRICS[String(metric)].periods.join(" or ")}`;
  }
  if (!isBlank(soft) && Number(soft) > Number(hard)) {
    return "soft must not be greater than hard";
  }
  if (!isBlank(warning) && Number(warning) > Number(soft || hard)) {
    return "warning must not be greater than soft or hard";
  }
  if (!isBlank(effective_to) && Number(effective_to) < Number(effective_from)) {
    return "effective_to must not be before effective_from";
  }
  return undefined;
};

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
};

/** A pending change to an Active limit, applied on the next business day. */
type PendingChange =
  | { type: "amend"; values: Record<string, VuuRowDataItemType> }
  | { type: "delete" };

type LimitValues = Record<string, VuuRowDataItemType>;

/** The values that differ from the current values. */
const changedValues = (current: LimitValues, values: LimitValues) =>
  Object.fromEntries(
    Object.entries(values).filter(
      ([column, value]) => current[column] !== value,
    ),
  );

const isTimestampColumn = (column: string) =>
  definitionColumns.find(({ name }) => name === column)?.serverDataType ===
  "epochtimestamp";

const pad = (n: number) => String(n).padStart(2, "0");

const formatValue = (column: string, value: VuuRowDataItemType) => {
  if (isTimestampColumn(column) && typeof value === "number") {
    const date = new Date(value);
    const month = pad(date.getMonth() + 1);
    return `${date.getFullYear()}-${month}-${pad(date.getDate())}`;
  }
  return String(value);
};

/** e.g. "soft changes to 120, hard changes to 150", in column order */
const describeChanges = (values: LimitValues) =>
  definitionColumns
    .filter(({ name }) => name in values)
    .map(({ name }) => [name, values[name]] as const)
    .map(
      ([column, value]) => `${column} changes to ${formatValue(column, value)}`,
    )
    .join(", ");

/**
 * Limit definitions, one row per limit. Changes are made in a session table,
 * created from a blueprint, and take effect on the next business day:
 *
 * - saving a session never changes an Active limit. A new limit is Pending.
 *   A change to, or deletion of, an Active limit is held, described in
 *   `change`, and the limit is Pending.
 * - at the start of the next business day, Pending limits become Active,
 *   with their held changes applied, see {@link activatePendingLimits}.
 *
 * Blueprints: `edit-limitDefinitions` holds the columns a user enters, with
 * their edit rules; `import-limitDefinitions` adds the CSV row number;
 * `export-limitDefinitions` has every column. The edit and import blueprints
 * save through their own endEditSession service.
 */
export class LimitsModule extends VuuModule<LimitsTableName> {
  /** Keys of the limits that have been Active, whose changes are held. */
  #activeKeys = new Set<string>();
  #pendingChanges = new Map<string, PendingChange>();
  #nextLimitKey = 1;

  #tables: Record<LimitsTableName, Table> = {
    limitDefinitions: tableContainer.createTable(
      limitsSchemas.limitDefinitions,
      [],
      buildDataColumnMap(limitsSchemas, "limitDefinitions"),
    ),
  };

  protected editableTables: readonly LimitsTableName[] = ["limitDefinitions"];

  protected sessionTableDefs: Record<string, SessionTableDef> = {
    "edit-limitDefinitions": {
      columns: [
        limitKeyColumn,
        ...definitionColumns,
        { name: "editChange", serverDataType: "string", ...readOnly },
      ],
      key: "limit_key",
      services: [{ rpcName: "endEditSession", service: this.#saveSession() }],
    },
    "import-limitDefinitions": {
      columns: [
        limitKeyColumn,
        ...definitionColumns,
        { name: "vuuRowNum", serverDataType: "int" },
      ],
      key: "limit_key",
      services: [{ rpcName: "endEditSession", service: this.#saveSession() }],
    },
    "export-limitDefinitions": {
      columns: limitsSchemas.limitDefinitions.columns,
      key: "limit_key",
    },
  };

  constructor() {
    super("LIMITS");
  }

  get #limits() {
    return this.#tables.limitDefinitions;
  }

  #rowValues(key: string) {
    const { map } = this.#limits;
    const row = this.#limits.findByKey(key);
    if (row === undefined) return undefined;
    const values: Record<string, VuuRowDataItemType> = {};
    for (const { name } of this.#limits.schema.columns) {
      values[name] = row[map[name]] as VuuRowDataItemType;
    }
    return values;
  }

  #update(key: string, values: Record<string, VuuRowDataItemType>) {
    for (const [column, value] of Object.entries(values)) {
      this.#limits.update(key, column, value);
    }
    this.#limits.update(key, "vuuUpdatedTimestamp", Date.now());
  }

  #insert(key: string, values: Record<string, VuuRowDataItemType>) {
    const now = Date.now();
    const { metric, entity_id } = values;
    const row: Record<string, VuuRowDataItemType> = {
      ...values,
      change: "New limit",
      effective_from: isBlank(values.effective_from)
        ? startOfToday()
        : values.effective_from,
      entity_type:
        LIMIT_ENTITIES.find((entity) => entity.entity_id === entity_id)
          ?.entity_type ?? "",
      limit_key: key,
      changed_by: LIMITS_USER,
      metric_family: LIMIT_METRICS[String(metric)].family,
      status: "Pending",
      vuuCreatedTimestamp: now,
      vuuMsg: "",
      vuuUpdatedTimestamp: now,
    };
    this.#limits.insert(
      this.#limits.schema.columns.map(({ name }) => row[name] ?? ""),
    );
  }

  /**
   * Save the changes in a session table, as Pending changes. Nothing is
   * saved unless every row is valid. A row that is not has its vuuMsg set,
   * and is named in the error, by its line for an import.
   */
  #saveSession(): ServiceHandler {
    return async (rpcRequest) => {
      const { viewPortId } = rpcRequest.context as { viewPortId: string };
      if ((rpcRequest.params as { save?: boolean }).save !== true) {
        return { type: "SUCCESS_RESULT", data: undefined };
      }
      const sessionTable = this.getSessionTable(viewPortId);
      const { map } = sessionTable;
      const columns = sessionTable.schema.columns
        .map(({ name }) => name)
        .filter((name) => LIMIT_DEFINITION_COLUMNS.includes(name));

      const changes = sessionTable.data.map((sessionRow) => {
        const key = String(sessionRow[map.limit_key]);
        const values: Record<string, VuuRowDataItemType> = {};
        for (const name of columns) {
          values[name] = sessionRow[map[name]] as VuuRowDataItemType;
        }
        const action = sessionRow[map.vuuAction];
        const editChange = String(sessionRow[map.editChange] ?? "");
        const current = this.#rowValues(key);
        const error =
          action === "addRow" || action === "editCell"
            ? validateLimitDefinition({ ...current, ...values })
            : undefined;
        // vuuRowNum numbers the data rows of a CSV from 1, after the header
        const rowName =
          map.vuuRowNum === undefined
            ? key
            : `line ${Number(sessionRow[map.vuuRowNum]) + 1}`;
        return { action, current, editChange, error, key, rowName, values };
      });

      const errors = changes.filter(({ error }) => error !== undefined);
      if (errors.length > 0) {
        for (const { error, key } of errors) {
          sessionTable.update(key, "vuuMsg", error as string);
        }
        const count =
          errors.length === 1 ? "1 limit" : `${errors.length} limits`;
        return {
          type: "ERROR_RESULT",
          errorMessage: `${count} could not be saved. ${errors
            .map(({ error, rowName }) => `${rowName}: ${error}`)
            .join(", ")}`,
        };
      }

      for (const { action, current, editChange, key, values } of changes) {
        if (action === "deleteRow") {
          this.#deleteLimit(key);
        } else if (action === "addRow" || action === "editCell") {
          if (current === undefined) {
            this.#insert(key, values);
          } else {
            this.#amendLimit(key, current, values, editChange);
          }
        }
      }
      return { type: "SUCCESS_RESULT", data: undefined };
    };
  }

  /**
   * The values of an Active limit once its held changes and the changes in
   * a session row are applied, where they differ from the Active values.
   */
  #amendedValues(key: string, current: LimitValues, values: LimitValues) {
    const held = this.#pendingChanges.get(key);
    return changedValues(current, {
      ...(held?.type === "amend" ? held.values : {}),
      ...changedValues(current, values),
    });
  }

  /**
   * Describes the change a session row will make, with the changes already
   * held: "New limit", "Delete", or each changed value.
   */
  #describeEdit(key: string, action: VuuRowDataItemType, values: LimitValues) {
    const current = this.#rowValues(key);
    if (action === "addRow" || current === undefined) {
      return "New limit";
    } else if (action === "deleteRow") {
      return "Delete";
    } else if (!this.#activeKeys.has(key)) {
      return "New limit";
    }
    const amended = this.#amendedValues(
      key,
      current,
      action === "editCell" ? values : {},
    );
    if (
      Object.keys(amended).length === 0 &&
      this.#pendingChanges.get(key)?.type === "delete"
    ) {
      return "Delete";
    }
    return describeChanges(amended);
  }

  /** editChange describes, for each row, the change saving will make. */
  protected sessionTableChanged(
    _tableName: LimitsTableName,
    sessionTable: Table,
  ) {
    const { map } = sessionTable;
    if (map.editChange === undefined) return;
    for (const row of sessionTable.data) {
      const key = String(row[map.limit_key]);
      const values: LimitValues = {};
      for (const name of LIMIT_DEFINITION_COLUMNS) {
        values[name] = row[map[name]] as VuuRowDataItemType;
      }
      const editChange = this.#describeEdit(
        key,
        row[map.vuuAction] as VuuRowDataItemType,
        values,
      );
      if (row[map.editChange] !== editChange) {
        sessionTable.update(key, "editChange", editChange);
      }
    }
  }

  #amendLimit(
    key: string,
    current: LimitValues,
    values: LimitValues,
    editChange: string,
  ) {
    if (this.#activeKeys.has(key)) {
      const amended = this.#amendedValues(key, current, values);
      if (Object.keys(amended).length === 0) {
        this.#pendingChanges.delete(key);
        this.#update(key, { change: "", changed_by: "", status: "Active" });
      } else {
        this.#pendingChanges.set(key, { type: "amend", values: amended });
        this.#update(key, {
          change: editChange,
          changed_by: LIMITS_USER,
          status: "Pending",
        });
      }
    } else {
      // never Active, so the new limit itself is changed
      this.#update(key, {
        ...values,
        change: "New limit",
        changed_by: LIMITS_USER,
        status: "Pending",
      });
    }
  }

  #deleteLimit(key: string) {
    if (this.#activeKeys.has(key)) {
      this.#pendingChanges.set(key, { type: "delete" });
      this.#update(key, {
        change: "Delete",
        changed_by: LIMITS_USER,
        status: "Pending",
      });
    } else {
      this.#limits.delete(key);
    }
  }

  /**
   * Simulates the start of the next business day: Pending limits become
   * Active, with their held changes applied, and pending deletes take effect.
   */
  activatePendingLimits() {
    const { map } = this.#limits;
    const pendingKeys = this.#limits.data
      .filter((row) => row[map.status] === "Pending")
      .map((row) => String(row[map.limit_key]));
    for (const key of pendingKeys) {
      const pending = this.#pendingChanges.get(key);
      this.#pendingChanges.delete(key);
      if (pending?.type === "delete") {
        this.#activeKeys.delete(key);
        this.#limits.delete(key);
      } else {
        this.#activeKeys.add(key);
        this.#update(key, {
          ...(pending?.type === "amend" ? pending.values : {}),
          change: "",
          status: "Active",
        });
      }
    }
  }

  get menus() {
    return undefined;
  }
  /**
   * activatePendingLimits, on a limitDefinitions viewport, activates
   * Pending limits at once, as at the start of the next business day.
   */
  get services(): Record<LimitsTableName, RpcService[]> {
    return {
      limitDefinitions: [
        {
          rpcName: "activatePendingLimits",
          service: async () => {
            this.activatePendingLimits();
            return { type: "SUCCESS_RESULT", data: undefined };
          },
        },
      ],
    };
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

  /** limit_key is generated by the server. */
  protected createRowKey() {
    return `LIM-${String(this.#nextLimitKey++).padStart(4, "0")}`;
  }

  protected validateEdit(
    _tableName: LimitsTableName,
    column: string,
    value: VuuRowDataItemType,
  ) {
    return validateLimitValue(column, value);
  }
}

export const limitsModule = new LimitsModule();
