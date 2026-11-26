import type { SchemaColumn, TableSchema } from "@vuu-ui/vuu-data-types";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import {
  type RpcMenuService,
  type RpcService,
  type SessionTableDef,
  VuuModule,
} from "../core/module/VuuModule";
import { NextDayChanges } from "../core/module/NextDayChanges";
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
      { name: "active", serverDataType: "boolean" },
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

/**
 * Limit definitions, one row per limit. Changes are made in a session table,
 * created from a blueprint, and take effect on the next business day, see
 * {@link NextDayChanges}.
 *
 * Blueprints: `edit-limitDefinitions` holds the columns a user enters, with
 * their edit rules; `import-limitDefinitions` adds the CSV row number;
 * `export-limitDefinitions` has every column. The edit and import blueprints
 * save through their own endEditSession service.
 */
export class LimitsModule extends VuuModule<LimitsTableName> {
  #nextLimitKey = 1;

  #tables: Record<LimitsTableName, Table> = {
    limitDefinitions: tableContainer.createTable(
      limitsSchemas.limitDefinitions,
      [],
      buildDataColumnMap(limitsSchemas, "limitDefinitions"),
    ),
  };

  #limits = new NextDayChanges({
    columns: definitionColumns,
    entityName: "limit",
    newValues: ({ effective_from, entity_id, metric }) => ({
      effective_from: isBlank(effective_from) ? startOfToday() : effective_from,
      entity_type:
        LIMIT_ENTITIES.find((entity) => entity.entity_id === entity_id)
          ?.entity_type ?? "",
      metric_family: LIMIT_METRICS[String(metric)].family,
    }),
    table: this.#tables.limitDefinitions,
    user: LIMITS_USER,
    validate: validateLimitDefinition,
  });

  #saveSession = this.#limits.endEditSession((viewPortId) =>
    this.getSessionTable(viewPortId),
  );

  protected editableTables: readonly LimitsTableName[] = ["limitDefinitions"];

  protected sessionTableDefs: Record<string, SessionTableDef> = {
    "edit-limitDefinitions": {
      columns: [
        limitKeyColumn,
        ...definitionColumns,
        { name: "editChange", serverDataType: "string", ...readOnly },
      ],
      key: "limit_key",
      services: [{ rpcName: "endEditSession", service: this.#saveSession }],
    },
    "import-limitDefinitions": {
      columns: [
        limitKeyColumn,
        ...definitionColumns,
        { name: "vuuRowNum", serverDataType: "int" },
      ],
      key: "limit_key",
      services: [{ rpcName: "endEditSession", service: this.#saveSession }],
    },
    "export-limitDefinitions": {
      columns: limitsSchemas.limitDefinitions.columns,
      key: "limit_key",
    },
  };

  constructor() {
    super("LIMITS");
  }

  /** editChange describes, for each row, the change saving will make. */
  protected sessionTableChanged(
    _tableName: LimitsTableName,
    sessionTable: Table,
  ) {
    this.#limits.describeEdits(sessionTable);
  }

  /**
   * Simulates the start of the next business day: limits with a change take
   * effect. New limits become active, held changes are applied and pending
   * deletes remove their limit.
   */
  activatePendingLimits() {
    this.#limits.activatePending();
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
