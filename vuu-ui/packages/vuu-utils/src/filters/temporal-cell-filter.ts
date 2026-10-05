import type { DataValueDescriptor } from "@vuu-ui/vuu-data-types";
import {
  dateTimePattern,
  defaultPatternsByType,
} from "../date/dateTimePattern";
import { EpochTimestamp } from "../date/EpochTimestamp";
import { formatTimestamp } from "../date/formatter";
import { getTemporalInfo } from "../date/temporal";
import { startOfDay } from "../date/time-zone";
import {
  getFractionalSecondDigits,
  temporalFormatter,
} from "../formatting-utils";

export interface TemporalCellFilter {
  /** The value, formatted as displayed */
  label: string;
  op: "=" | "between-inclusive";
  value: string | [string, string];
}

const pad2 = (n: number) => `${n}`.padStart(2, "0");

/**
 * Describes a filter that matches a temporal value at the precision with which
 * it is displayed by the given column descriptor, e.g. where the descriptor
 * displays milliseconds, the filter matches the whole millisecond.
 * - date (or dateOnly) => the whole day, as a start of day value
 * - time => a time of day (TimeString), truncated to the displayed precision
 * - datetime => a range, unless the displayed precision is that of the encoding
 * The filter is suitable for FilterAggregator.add (with the same descriptor) and
 * matches the value a ColumnFilter with this descriptor would commit.
 *
 * @param column the descriptor of the filter (or table cell) displaying the value
 * @param value a value as received from the server
 * @param dateOnly a 'datetime' value is displayed as a date (e.g. by a
 * DatePicker). Ignored for 'time' descriptors.
 * @returns undefined if value is empty or column is not temporal
 */
export const getTemporalCellFilter = (
  column: DataValueDescriptor,
  value: unknown,
  dateOnly = false,
): TemporalCellFilter | undefined => {
  const temporalInfo = getTemporalInfo(column);
  if (temporalInfo === undefined) {
    return undefined;
  }
  const { encoding, kind, timeZone } = temporalInfo;
  const ts = EpochTimestamp.fromWire(value, encoding);
  if (ts === undefined) {
    return undefined;
  }

  const pattern = dateTimePattern(column.type, kind);
  if (
    kind === "date" ||
    (dateOnly && kind === "datetime") ||
    pattern.time === undefined
  ) {
    const { date = defaultPatternsByType.date } = pattern;
    const start = EpochTimestamp.fromMillis(
      startOfDay(ts.epochMillis, timeZone),
    );
    return {
      label: formatTimestamp({ date }, { timeZone })(ts),
      op: "=",
      value: `${start.toWire(encoding)}`,
    };
  }

  const digits = Math.max(
    0,
    Math.min(9, getFractionalSecondDigits(column, temporalInfo)),
  );
  const unit = encoding === "epochNanos" ? 1n : 1_000_000n;
  const period = 10n ** BigInt(9 - digits);
  const startNanos = ts.epochNanos - (ts.epochNanos % period);
  const start = EpochTimestamp.fromNanos(startNanos);
  const label = temporalFormatter(column, temporalInfo)(start.toWire(encoding));

  if (kind === "time") {
    const { hour, minute, second } = ts.getFields(timeZone);
    const fraction = ts.fractionalSecond(digits);
    return {
      label,
      op: "=",
      value: `${pad2(hour)}:${pad2(minute)}:${pad2(second)}${fraction ? `.${fraction}` : ""}`,
    };
  } else if (period <= unit) {
    return { label, op: "=", value: `${ts.toWire(encoding)}` };
  } else {
    const end = EpochTimestamp.fromNanos(startNanos + period - unit);
    return {
      label,
      op: "between-inclusive",
      value: [`${start.toWire(encoding)}`, `${end.toWire(encoding)}`],
    };
  }
};
