import { DataValueDescriptor } from "@vuu-ui/vuu-data-types";
import {
  ColumnDescriptor,
  ColumnTypeFormatting,
  ColumnTypeValueMap,
  ValueFormatter,
} from "@vuu-ui/vuu-table-types";
import { isMappedValueTypeRenderer, isTypeDescriptor } from "./column-utils";
import { dateTimePattern, defaultPatternsByType } from "./date/dateTimePattern";
import { isStartOfDay } from "./date/time-zone";
import { EpochTimestamp } from "./date/EpochTimestamp";
import { formatTimestamp } from "./date/formatter";
import { getTemporalInfo } from "./date/temporal";
import { roundDecimal, roundScaledDecimal } from "./round-decimal";
import { isNumericType } from "./protocol-message-utils";

export type ValueFormatters = {
  [key: string]: ValueFormatter;
};

const DEFAULT_NUMERIC_FORMAT: ColumnTypeFormatting = {};

export const defaultValueFormatter = (value: unknown) =>
  value == null ? "" : typeof value === "string" ? value : value.toString();

/**
 * Creates a formatter for a temporal value (see getTemporalInfo). Handles
 * millisecond and nanosecond encodings, the configured (or default) pattern,
 * time zone, locale and fractional second digits.
 * Empty values (null, undefined, '', 0) are rendered as empty string.
 */
export const temporalFormatter = (
  column: DataValueDescriptor,
  temporalInfo = getTemporalInfo(column),
): ValueFormatter => {
  if (temporalInfo === undefined) {
    return defaultValueFormatter;
  }
  const { encoding, kind, precision, timeZone } = temporalInfo;
  const formatting = isTypeDescriptor(column.type)
    ? (column.type.formatting ?? DEFAULT_NUMERIC_FORMAT)
    : DEFAULT_NUMERIC_FORMAT;
  const pattern = dateTimePattern(column.type, kind);
  const fractionalSecondDigits =
    formatting.fractionalSecondDigits ??
    (pattern.time === "hh:mm:ss.ms"
      ? 3
      : precision === "ns" && pattern.time
        ? 9
        : 0);

  const formatter = formatTimestamp(pattern, {
    fractionalSecondDigits,
    locale: formatting.locale,
    timeZone,
  });

  return (value: unknown) => {
    const timestamp = EpochTimestamp.fromWire(value, encoding);
    return timestamp ? formatter(timestamp) : "";
  };
};

const timeOfDayPattern = /^\d{2}:\d{2}:\d{2}(\.\d{1,9})?$/;

/**
 * Format a filter value on a temporal column for display (e.g. in a FilterPill
 * tooltip or a list of filter clauses). Time of day (TimeString) values are
 * displayed as is. A 'datetime' value at the start of a day (which the filter
 * applies to the whole day, see temporalFilterAsQuery) is displayed as a date.
 */
export const formatTemporalFilterValue = (
  value: unknown,
  column: DataValueDescriptor,
): string => {
  const temporalInfo = getTemporalInfo(column);
  if (typeof value === "string" && timeOfDayPattern.test(value)) {
    return value;
  } else if (temporalInfo === undefined) {
    return defaultValueFormatter(value);
  }
  const timestamp = EpochTimestamp.fromWire(value, temporalInfo.encoding);
  if (timestamp === undefined) {
    return defaultValueFormatter(value);
  }
  if (
    temporalInfo.kind === "datetime" &&
    timestamp.subMilliNanos === 0 &&
    isStartOfDay(timestamp.epochMillis, temporalInfo.timeZone)
  ) {
    const { date = defaultPatternsByType.date } = dateTimePattern(
      column.type,
      "date",
    );
    return formatTimestamp(
      { date },
      { timeZone: temporalInfo.timeZone },
    )(timestamp);
  }
  return temporalFormatter(column, temporalInfo)(value);
};

export const numericFormatter = ({
  align = "right",
  serverDataType,
  type,
}: Partial<ColumnDescriptor>) => {
  if (type === undefined || typeof type === "string") {
    return defaultValueFormatter;
  } else {
    const {
      alignOnDecimals = false,
      decimals,
      roundingRule,
      useLocaleString,
      zeroPad = false,
    } = type.formatting ?? DEFAULT_NUMERIC_FORMAT;
    return (value: unknown) => {
      if (serverDataType?.startsWith("scaleddecimal")) {
        if (typeof value === "string") {
          return roundScaledDecimal(
            value,
            align,
            decimals,
            zeroPad,
            alignOnDecimals,
            useLocaleString,
            roundingRule,
          );
        } else {
          throw Error(
            `[formatting-utils] numericFormatter, invalid data for ${serverDataType}: '${value}'`,
          );
        }
      }
      if (
        typeof value === "string" &&
        (value.startsWith("Σ") || value.startsWith("["))
      ) {
        return value;
      }
      const number =
        typeof value === "number"
          ? value
          : typeof value === "string"
            ? parseFloat(value)
            : undefined;
      return roundDecimal(
        number,
        align,
        decimals,
        zeroPad,
        alignOnDecimals,
        useLocaleString,
        roundingRule,
      );
    };
  }
};

const mapFormatter = (map: ColumnTypeValueMap) => {
  return (value: unknown) => {
    return map[value as string] ?? "";
  };
};

const NumericTypes = ["decimal", "number"];

export const getValueFormatter = (column: ColumnDescriptor): ValueFormatter => {
  const { serverDataType = "string" } = column;
  const temporalInfo = getTemporalInfo(column);
  if (temporalInfo) {
    return temporalFormatter(column, temporalInfo);
  }

  const { type } = column;
  if (isTypeDescriptor(type) && isMappedValueTypeRenderer(type?.renderer)) {
    return mapFormatter(type.renderer.map);
  } else if (
    isNumericType(serverDataType) ||
    (isTypeDescriptor(type) && NumericTypes.includes(type.name))
  ) {
    return numericFormatter(column);
  } else if (serverDataType === "string" || serverDataType === "char") {
    return (value: unknown) => value as string;
  }
  return defaultValueFormatter;
};

/**
 * Lowercases a string and returns as Lowercase typescript type
 *
 * @param str the input string
 * @returns str converted to Lowercase
 */
export const lowerCase = (str: string) =>
  str.toLowerCase() as Lowercase<string>;
