import type { SchemaColumn, TableSchema } from "@vuu-ui/vuu-data-types";
import {
  LIMIT_PRODUCTS,
  LIMIT_TIME_DURATION,
  LIMIT_TYPES,
  limitsSchemas,
  TRADER_LIMITS_TABLE,
  validateTraderLimit,
} from "@vuu-ui/vuu-data-test";
import type { CsvColumnValidator } from "@vuu-ui/vuu-table-extras";
import type { ColumnDescriptor, TableConfig } from "@vuu-ui/vuu-table-types";

export { TRADER_LIMITS_TABLE };

const readOnly = { editable: false } as const;
const insertOnly = { editable: { insert: true, update: false } } as const;

export const traderLimitsColumns: ColumnDescriptor[] = [
  { name: "status", label: "Status", width: 90, ...readOnly },
  { name: "limit_key", hidden: true, ...readOnly },
  { name: "trader_id", label: "Trader", width: 120, ...insertOnly },
  { name: "limit_id", label: "Limit ID", width: 110, ...insertOnly },
  { name: "product_id", label: "Product", width: 90, ...readOnly },
  { name: "limit_type", label: "Limit type", width: 150, ...readOnly },
  {
    name: "limit",
    label: "Limit",
    width: 120,
    editable: true,
    type: { name: "number", formatting: { decimals: 0 } },
  },
  { name: "time_duration", label: "Duration (s)", width: 100, ...readOnly },
  { name: "change", label: "Change", width: 200, ...readOnly },
  {
    name: "vuuCreatedTimestamp",
    label: "Created",
    width: 170,
    ...readOnly,
    type: { name: "date/time" },
  },
  {
    name: "vuuUpdatedTimestamp",
    label: "Updated",
    width: 170,
    ...readOnly,
    type: { name: "date/time" },
  },
  { name: "vuuMsg", label: "Message", width: 200, ...readOnly },
].map((column) => ({
  ...column,
  serverDataType: limitsSchemas.traderLimits.columns.find(
    ({ name }) => name === column.name,
  )?.serverDataType,
})) as ColumnDescriptor[];

export const traderLimitsColumnNames = traderLimitsColumns.map(
  ({ name }) => name,
);

export const traderLimitsTableConfig: TableConfig = {
  columns: traderLimitsColumns,
  rowSeparators: true,
  zebraStripes: true,
};

/** Values the user does not enter, for new rows. */
export const traderLimitRowDefaults = {
  limit_type: LIMIT_TYPES[0],
  product_id: LIMIT_PRODUCTS[0],
  time_duration: LIMIT_TIME_DURATION,
};

/** The columns in the CSV template, in order. */
export const TEMPLATE_COLUMNS = [
  "trader_id",
  "limit_id",
  "product_id",
  "limit_type",
  "limit",
  "time_duration",
];

const schemaColumn = (name: string) => {
  const column = limitsSchemas.traderLimits.columns.find(
    (col) => col.name === name,
  );
  if (column === undefined) {
    throw Error(`traderLimits has no column ${name}`);
  }
  return column;
};

/** CsvUpload reports an empty cell in a `required` column. */
type ImportSchemaColumn = SchemaColumn & { required?: boolean };

/**
 * What an imported CSV is validated against. The key, limit_key, is built
 * by the server from limit_id and trader_id, so the CSV does not include it;
 * rows are keyed by their line in the file instead.
 */
const importColumns: ImportSchemaColumn[] = [
  ...TEMPLATE_COLUMNS.map((name) => ({ ...schemaColumn(name), required: true })),
  { name: "vuuRowNum", serverDataType: "int" },
];

export const traderLimitsImportSchema: TableSchema = {
  ...limitsSchemas.traderLimits,
  columns: importColumns,
  key: "vuuRowNum",
};

const validator: CsvColumnValidator = (value, columnName) =>
  validateTraderLimit(
    columnName,
    columnName === "limit" || columnName === "time_duration"
      ? Number(value)
      : value,
  ) ?? true;

export const traderLimitsCsvValidators = Object.fromEntries(
  TEMPLATE_COLUMNS.map((name) => [name, validator]),
);
