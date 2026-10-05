import type { TableSchema } from "@vuu-ui/vuu-data-types";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import type {
  ColumnDescriptorsByName,
  Filter,
  SingleValueFilterClause,
} from "@vuu-ui/vuu-filter-types";
import type { TimeString } from "../date/date-utils";
import { EpochTimestamp } from "../date/EpochTimestamp";
import { getTemporalInfo, type TemporalInfo } from "../date/temporal";
import {
  isStartOfDay,
  type RelativeDate,
  startOfDay,
  startOfNextDay,
  timeOfDayToEpochMillis,
} from "../date/time-zone";
import { stringIsValidLong } from "../data-utils";
import {
  isMultiClauseFilter,
  isMultiValueFilter,
  isSerializableFilter,
} from "./filter-utils";
import { ScaledDecimal } from "../ScaledDecimal";

const filterValue = (
  value: string | number | boolean | ScaledDecimal,
  columnType?: string,
) => {
  if (typeof value === "string") {
    if (columnType !== undefined) {
      // If we have precise type metadata, format numeric types without quotes,
      // and string-like types with quotes.
      const isNumericType = [
        "int",
        "long",
        "double",
        "epochtimestamp",
        "epochtimestampnano",
      ].includes(columnType);
      return isNumericType ? value : `"${value}"`;
    }
    // If no metadata is present, do a safe regex boundary check.
    return stringIsValidLong(value) ? value : `"${value}"`;
  }
  return value instanceof ScaledDecimal || typeof value === "bigint"
    ? value.toString()
    : value;
};

const quotedStrings = (value: string | number | boolean) =>
  typeof value === "string" ? `"${value}"` : value;

const removeOuterMostParentheses = (s: string) => s.replace(/^\((.*)\)$/, "$1");

export const filterAsQuery = (
  f: Filter,
  opts?: { columnsByName?: ColumnDescriptorsByName },
): string => {
  return removeOuterMostParentheses(filterAsQueryCore(f, opts));
};

const filterAsQueryCore = (
  f: Filter,
  opts?: { columnsByName?: ColumnDescriptorsByName },
): string => {
  if (isMultiClauseFilter(f)) {
    const multiClauseFilter = f.filters
      .map((filter) => filterAsQueryCore(filter, opts))
      .join(` ${f.op} `);
    return `(${multiClauseFilter})`;
  } else if (isMultiValueFilter(f)) {
    const column = opts?.columnsByName?.[f.column];
    const temporalInfo = getTemporalInfo(column);
    const values: (string | number | boolean)[] = f.values;
    if (temporalInfo) {
      const literals = values.map(
        (v) =>
          EpochTimestamp.fromWire(v, temporalInfo.encoding)?.toLiteral(
            temporalInfo.encoding,
          ) ?? quotedStrings(v),
      );
      return `${f.column} ${f.op} [${literals.join(",")}]`;
    }
    return `${f.column} ${f.op} [${values.map(quotedStrings).join(",")}]`;
  } else {
    return singleValueFilterAsQuery(f, opts);
  }
};

function singleValueFilterAsQuery(
  f: SingleValueFilterClause,
  opts?: { columnsByName?: ColumnDescriptorsByName },
): string {
  if (isSerializableFilter(f)) {
    return f.asQuery();
  } else {
    const column = opts?.columnsByName?.[f.column];
    const temporalInfo = getTemporalInfo(column);
    if (temporalInfo) {
      return temporalFilterAsQuery(f, temporalInfo);
    } else {
      return defaultSingleValueFilterAsQuery(f, opts);
    }
  }
}

export const ONE_DAY_IN_MILLIS = 1000 * 60 * 60 * 24;

const timeOfDayPattern = /^\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?$/;

const NANOS_PER_SECOND = 1_000_000_000;
const NANOS_PER_MILLI = 1_000_000;

/**
 * 'day', 'exact' or the size, in nanoseconds, of the period a value represents.
 */
type Granularity = "day" | "exact" | number;

export interface TemporalFilterAsQueryOptions {
  /**
   * The date against which time of day (TimeString) values are resolved.
   * Default is 'today', resolved at the time the query is created.
   */
  date?: RelativeDate;
}

const resolveTemporalFilterValue = (
  value: SingleValueFilterClause["value"],
  { encoding, kind, timeZone }: TemporalInfo,
  date: RelativeDate = "today",
): [EpochTimestamp | undefined, Granularity] => {
  if (typeof value === "string" && timeOfDayPattern.test(value)) {
    // A time of day, resolved against the given date (default today) at the
    // time the query is created, so a persisted filter remains relative to 'today'.
    const [hms, fraction = ""] = value.split(".");
    const millis = timeOfDayToEpochMillis(hms as TimeString, date, timeZone);
    const nanos = parseInt(fraction.padEnd(9, "0"), 10);
    const ts = EpochTimestamp.fromMillis(
      millis + Math.floor(nanos / NANOS_PER_MILLI),
      encoding === "epochNanos" ? nanos % NANOS_PER_MILLI : 0,
    );
    // The precision of the value determines the period it represents, e.g
    // 10:00:00.123 is the whole millisecond, unless the column encoding
    // cannot represent anything finer.
    const period = 10 ** (9 - Math.min(fraction.length, 9));
    const unit = encoding === "epochNanos" ? 1 : NANOS_PER_MILLI;
    return [ts, period > unit ? period : "exact"];
  }
  const ts = EpochTimestamp.fromWire(
    value instanceof ScaledDecimal ? value.asLong : value,
    encoding,
  );
  if (ts === undefined) {
    return [undefined, "exact"];
  }
  const isWholeDay =
    ts.subMilliNanos === 0 && isStartOfDay(ts.epochMillis, timeZone);
  if (kind === "date" || (kind === "datetime" && isWholeDay)) {
    return [ts, "day"];
  } else if (
    kind === "time" &&
    ts.subMilliNanos === 0 &&
    ts.epochMillis % 1000 === 0
  ) {
    return [ts, NANOS_PER_SECOND];
  }
  return [ts, "exact"];
};

/**
 * Serialize a filter clause on a temporal column. Values are interpreted at
 * the granularity implied by the value and the column 'kind':
 * - day: column kind is 'date', or a 'datetime' value at the exact start of a
 *   day (in the column time zone), e.g as selected from a DatePicker. The clause
 *   applies to the whole day: '=' becomes a [startOfDay, startOfNextDay) range,
 *   '>' becomes '>= startOfNextDay' etc. Day boundaries are DST safe.
 * - period: time of day values (TimeString or whole second 'time' values). A
 *   TimeString represents the period implied by its precision, e.g hh:mm:ss is
 *   the whole second, hh:mm:ss.fff the whole millisecond (on a nanosecond
 *   column), and is treated like the day granularity above.
 * - exact: all other values
 * Values are encoded according to the column encoding (millis or nanos).
 */
export function temporalFilterAsQuery(
  f: SingleValueFilterClause,
  temporalInfo: TemporalInfo,
  options?: TemporalFilterAsQueryOptions,
): string {
  const { column, op } = f;
  const { encoding, timeZone } = temporalInfo;
  const [ts, granularity] = resolveTemporalFilterValue(
    f.value,
    temporalInfo,
    options?.date,
  );

  if (ts === undefined) {
    return `${column} ${op} ${filterValue(f.value, "long")}`;
  }

  if (granularity === "exact") {
    return `${column} ${op} ${ts.toLiteral(encoding)}`;
  }

  const [start, end] =
    granularity === "day"
      ? [
          EpochTimestamp.fromMillis(startOfDay(ts.epochMillis, timeZone)),
          EpochTimestamp.fromMillis(startOfNextDay(ts.epochMillis, timeZone)),
        ]
      : [ts, EpochTimestamp.fromNanos(ts.epochNanos + BigInt(granularity))];

  const from = start.toLiteral(encoding);
  const to = end.toLiteral(encoding);

  switch (op) {
    case "=":
      return `(${column} >= ${from} and ${column} < ${to})`;
    case "!=":
      return `(${column} < ${from} or ${column} >= ${to})`;
    case ">":
      return `${column} >= ${to}`;
    case ">=":
      return `${column} >= ${from}`;
    case "<":
      return `${column} < ${from}`;
    case "<=":
      return `${column} < ${to}`;
    default:
      return `${column} ${op} ${ts.toLiteral(encoding)}`;
  }
}

/**
 * @deprecated use temporalFilterAsQuery
 */
export function dateFilterAsQuery(
  f: SingleValueFilterClause<number>,
  opts?: { columnsByName?: ColumnDescriptorsByName },
): string {
  const temporalInfo = getTemporalInfo(
    opts?.columnsByName?.[f.column] ?? { type: "date/time" },
  ) as TemporalInfo;
  return temporalFilterAsQuery(f, temporalInfo);
}

const defaultSingleValueFilterAsQuery = (
  f: SingleValueFilterClause,
  opts?: { columnsByName?: ColumnDescriptorsByName },
) => {
  const columnType = opts?.columnsByName?.[f.column]?.serverDataType;
  return `${f.column} ${f.op} ${filterValue(f.value, columnType)}`;
};

export const getColumnsByName = (
  columns: readonly ColumnDescriptor[],
): ColumnDescriptorsByName =>
  columns.reduce<ColumnDescriptorsByName>((map, column) => {
    map[column.name] = column;
    return map;
  }, {});

/**
 * Build the columnsByName used to serialize a filter. Column descriptors
 * provided by client take precedence over (are merged with) the schema columns.
 */
export const getColumnsByNameForFilter = (
  tableSchema?: Pick<TableSchema, "columns">,
  columnsByName?: ColumnDescriptorsByName,
): ColumnDescriptorsByName | undefined => {
  if (tableSchema === undefined) {
    return columnsByName;
  }
  const result: ColumnDescriptorsByName = {};
  for (const column of tableSchema.columns) {
    result[column.name] = { ...column, ...columnsByName?.[column.name] };
  }
  if (columnsByName) {
    for (const [name, column] of Object.entries(columnsByName)) {
      result[name] ??= column;
    }
  }
  return result;
};

/**
 * Returns true if the filter includes clauses whose meaning depends on the
 * column type (temporal columns) or which serialize themselves. Such filters
 * must be resolved (see resolveFilterQuery) before they can be evaluated locally.
 */
export const filterRequiresResolution = (
  filter: Filter,
  columnsByName?: ColumnDescriptorsByName,
): boolean => {
  if (isMultiClauseFilter(filter)) {
    return filter.filters.some((f) =>
      filterRequiresResolution(f, columnsByName),
    );
  } else if (isSerializableFilter(filter as SingleValueFilterClause)) {
    return true;
  } else {
    return getTemporalInfo(columnsByName?.[filter.column]) !== undefined;
  }
};
