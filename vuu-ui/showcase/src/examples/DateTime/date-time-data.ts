import { ArrayDataSource } from "@vuu-ui/vuu-data-local";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { startOfDay } from "@vuu-ui/vuu-utils";

/**
 * Test data for the DateTime examples. Every row holds the same instant,
 * encoded in each of the ways the Vuu server can send a timestamp:
 *
 * - tradeDate      epochtimestamp, always at start of day (UTC)
 * - tradeTime      epochtimestamp, millisecond precision
 * - execTime       epochtimestampnano, nanosecond precision, sent as a string
 * - legacyCreated  long, epoch millis. Before epochtimestamp existed, a server
 *                  could only describe this as a long, the UI needs a 'type'
 *                  to know it is a timestamp.
 *
 * Timestamps are spread across today and the preceding days, so 'time of
 * day' filters (which are resolved against today) will match some rows.
 */

const DAY = 86_400_000;
const NANOS_PER_MILLI = 1_000_000n;

export type DateTimeColumnName =
  | "id"
  | "ccy"
  | "tradeDate"
  | "tradeTime"
  | "execTime"
  | "legacyCreated"
  | "price";

export const dateTimeSchemaColumns: ExampleColumn[] = [
  { name: "id", serverDataType: "string", width: 60 },
  { name: "ccy", serverDataType: "string", width: 60 },
  { name: "tradeDate", serverDataType: "epochtimestamp" },
  { name: "tradeTime", serverDataType: "epochtimestamp" },
  { name: "execTime", serverDataType: "epochtimestampnano" },
  { name: "legacyCreated", serverDataType: "long" },
  { name: "price", serverDataType: "double" },
];

/**
 * A column in an example table. Several example columns may present the same
 * source data value, each with a different type/formatting.
 */
export type ExampleColumn = ColumnDescriptor & {
  sourceColumn?: DateTimeColumnName;
};

const currencies = ["EUR", "GBP", "USD", "JPY", "CHF"];

// deterministic pseudo random sequence, so data is repeatable within a day
const random = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

export const createDateTimeData = (rowCount = 200, days = 5) => {
  const next = random(42);
  const today = startOfDay(Date.now());
  const rows: VuuRowDataItemType[][] = [];
  for (let i = 0; i < rowCount; i++) {
    const dayOffset = Math.floor(next() * days);
    const millisInDay = Math.floor(next() * DAY);
    const tradeTime = today - dayOffset * DAY + millisInDay;
    const subMilliNanos = BigInt(Math.floor(next() * 1_000_000));
    const execTimeNanos =
      BigInt(tradeTime + Math.floor(next() * 500)) * NANOS_PER_MILLI +
      subMilliNanos;
    const d = new Date(tradeTime);
    const tradeDate = Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
    );
    rows.push([
      `${i + 1}`,
      currencies[i % currencies.length],
      tradeDate,
      tradeTime,
      // epochtimestampnano values are sent by the server as strings
      execTimeNanos.toString(),
      tradeTime - Math.floor(next() * 3_600_000),
      Math.round(next() * 10_000) / 100,
    ]);
  }
  return rows;
};

const schemaIndex = new Map(dateTimeSchemaColumns.map((c, i) => [c.name, i]));

export const toColumnDescriptor = ({
  sourceColumn: _source,
  ...column
}: ExampleColumn): ColumnDescriptor => {
  if (column.serverDataType === undefined) {
    const schemaColumn = dateTimeSchemaColumns.find(
      (c) => c.name === (_source ?? column.name),
    );
    return { ...column, serverDataType: schemaColumn?.serverDataType };
  }
  return column;
};

/**
 * Create an ArrayDataSource for the given example columns. Each column
 * takes its values from the 'source' schema column (default, the column
 * with the same name), the column descriptor determines how values are
 * presented and filtered.
 */
export const createDateTimeDataSource = (
  columns: ExampleColumn[] = dateTimeSchemaColumns,
  data = createDateTimeData(),
) => {
  const indices = columns.map(
    (col) => schemaIndex.get(col.sourceColumn ?? col.name) ?? 0,
  );
  const hasId = columns.some((col) => col.name === "id");
  const projected = data.map((row) => {
    const values = indices.map((i) => row[i]);
    return hasId ? values : [row[0], ...values];
  });
  const columnDescriptors = columns.map(toColumnDescriptor);
  return new ArrayDataSource({
    columnDescriptors: hasId
      ? columnDescriptors
      : [dateTimeSchemaColumns[0], ...columnDescriptors],
    data: projected,
    keyColumn: "id",
  });
};
