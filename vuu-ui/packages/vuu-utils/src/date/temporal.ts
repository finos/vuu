import type {
  DataValueDescriptor,
  TemporalDataValueTypeSimple,
} from "@vuu-ui/vuu-data-types";
import type { FractionalSecondDigits } from "@vuu-ui/vuu-table-types";
import { EpochTimestamp, type TemporalEncoding } from "./EpochTimestamp";
import {
  getDefaultTimeZone,
  resolveRelativeDate,
  type TimeZoneSpec,
} from "./time-zone";

/**
 * What a temporal value represents, from the user's perspective
 * - datetime: a point in time, date and time of day are both meaningful
 * - date: a calendar date, time of day is not meaningful
 * - time: a time of day, the date is not meaningful (typically 'today')
 */
export type TemporalKind = "datetime" | "date" | "time";
/**
 * The finest resolution that the encoding can represent.
 */
export type TemporalPrecision = "ms" | "ns";

export interface TemporalInfo {
  kind: TemporalKind;
  encoding: TemporalEncoding;
  precision: TemporalPrecision;
  timeZone: TimeZoneSpec;
}

const temporalKindByTypeName: Record<
  TemporalDataValueTypeSimple,
  TemporalKind
> = {
  "date/time": "datetime",
  date: "date",
  time: "time",
};

export const isTemporalTypeName = (
  typeName?: string,
): typeName is TemporalDataValueTypeSimple =>
  typeName === "date/time" || typeName === "date" || typeName === "time";

type TemporalDescriptor = Pick<DataValueDescriptor, "serverDataType" | "type">;

const getTypeName = ({ type }: TemporalDescriptor) =>
  typeof type === "string" ? type : type?.name;

/**
 * The single source of truth for whether (and how) a column or form field
 * holds a temporal value. Rules:
 *
 * - encoding is determined by serverDataType
 *   - epochtimestamp => epochMillis
 *   - epochtimestampnano => epochNanos
 *   - long, int, double (or unspecified) => epochMillis, but only when the
 *     'type' is a temporal type. This legacy usage (pre epochtimestamp) is
 *     DEPRECATED and supported only for backward compatibility. Timestamps
 *     should be described by the server as epochtimestamp or epochtimestampnano.
 * - kind is determined by 'type' ('date/time', 'date', 'time'), default 'datetime'.
 *   An explicit type of 'number' opts an epochtimestamp column out of temporal
 *   treatment altogether.
 * - timeZone from type.formatting.timeZone, falling back to the default time zone
 *
 * @returns TemporalInfo or undefined if value is not temporal
 */
export const getTemporalInfo = (
  descriptor?: TemporalDescriptor,
): TemporalInfo | undefined => {
  if (descriptor === undefined) {
    return undefined;
  }
  const { serverDataType, type } = descriptor;
  const typeName = getTypeName(descriptor);
  const kindFromType = isTemporalTypeName(typeName)
    ? temporalKindByTypeName[typeName]
    : undefined;

  let encoding: TemporalEncoding | undefined;
  switch (serverDataType) {
    case "epochtimestamp":
      encoding = typeName === "number" ? undefined : "epochMillis";
      break;
    case "epochtimestampnano":
      encoding = typeName === "number" ? undefined : "epochNanos";
      break;
    case undefined:
    case "long":
    case "int":
    case "double":
      encoding = kindFromType ? "epochMillis" : undefined;
      break;
  }

  if (encoding === undefined) {
    return undefined;
  }

  const timeZone =
    (typeof type === "object" ? type.formatting?.timeZone : undefined) ??
    getDefaultTimeZone();

  return {
    kind: kindFromType ?? "datetime",
    encoding,
    precision: encoding === "epochNanos" ? "ns" : "ms",
    timeZone,
  };
};

export const isTemporal = (descriptor?: TemporalDescriptor) =>
  getTemporalInfo(descriptor) !== undefined;

export const defaultFractionalSecondDigits = (
  info: Pick<TemporalInfo, "precision">,
): FractionalSecondDigits => (info.precision === "ns" ? 9 : 3);

const pad2 = (n: number) => `${n}`.padStart(2, "0");

/**
 * Format a timestamp as a canonical, locale independent, editable string:
 * - date: yyyy-mm-dd
 * - datetime: yyyy-mm-dd hh:mm:ss[.fffffffff]
 * - time: hh:mm:ss[.fffffffff]
 * Sub-second digits are included only when non zero, up to the precision of
 * the encoding, so they round-trip unchanged through an edit.
 */
export const formatTemporalInput = (
  value: EpochTimestamp | undefined,
  { kind, precision, timeZone }: Omit<TemporalInfo, "encoding">,
) => {
  if (value === undefined) {
    return "";
  }
  const { year, month, day, hour, minute, second } = value.getFields(timeZone);
  const date = `${year}-${pad2(month)}-${pad2(day)}`;
  if (kind === "date") {
    return date;
  }
  const fraction = value
    .fractionalSecond(precision === "ns" ? 9 : 3)
    .replace(/0+$/, "");
  const time = `${pad2(hour)}:${pad2(minute)}:${pad2(second)}${fraction ? `.${fraction}` : ""}`;
  return kind === "time" ? time : `${date} ${time}`;
};

const dateTimeInputPattern =
  /^\s*(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?)?\s*$/;
const timeInputPattern =
  /^\s*(\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?\s*$/;
const epochDigitsPattern = /^\s*-?\d{9,}\s*$/;

const daysInMonth = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

const fractionToMillisAndNanos = (fraction = ""): [number, number] => {
  const nine = fraction.padEnd(9, "0");
  return [parseInt(nine.slice(0, 3), 10), parseInt(nine.slice(3), 10)];
};

/**
 * Parse user input. Accepts the canonical formats produced by
 * formatTemporalInput as well as raw epoch values (in the encoding of the
 * column). Where the input does not include a component (e.g the date for a
 * 'time' value), it is taken from baseValue if provided, otherwise today
 * (date) or midnight (time).
 *
 * @returns EpochTimestamp, or undefined if input is not valid
 */
export const parseTemporalInput = (
  input: string,
  { kind, encoding, precision, timeZone }: TemporalInfo,
  baseValue?: EpochTimestamp,
): EpochTimestamp | undefined => {
  if (epochDigitsPattern.test(input)) {
    return EpochTimestamp.fromWire(input.trim(), encoding);
  }

  const base = baseValue?.getFields(timeZone);
  const keepNanos = precision === "ns";

  if (kind === "time") {
    const match = timeInputPattern.exec(input);
    if (match) {
      const [, h, m, s = "0", fraction] = match;
      const hour = parseInt(h, 10);
      const minute = parseInt(m, 10);
      const second = parseInt(s, 10);
      if (hour > 23 || minute > 59 || second > 59) {
        return undefined;
      }
      const [millisecond, nanos] = fractionToMillisAndNanos(fraction);
      const { year, month, day } =
        base ?? resolveRelativeDate("today", timeZone);
      return EpochTimestamp.fromFields(
        { year, month, day, hour, minute, second, millisecond },
        timeZone,
        keepNanos ? nanos : 0,
      );
    }
    return undefined;
  }

  const match = dateTimeInputPattern.exec(input);
  if (match) {
    const [, y, mo, d, h, mi, s = "0", fraction] = match;
    const year = parseInt(y, 10);
    const month = parseInt(mo, 10);
    const day = parseInt(d, 10);
    if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
      return undefined;
    }
    if (h === undefined) {
      if (kind === "date" && base && baseValue) {
        // preserve the time of day of the original value
        const { hour, minute, second, millisecond } = base;
        return EpochTimestamp.fromFields(
          { year, month, day, hour, minute, second, millisecond },
          timeZone,
          baseValue.subMilliNanos,
        );
      }
      return EpochTimestamp.fromFields({ year, month, day }, timeZone);
    }
    const hour = parseInt(h, 10);
    const minute = parseInt(mi, 10);
    const second = parseInt(s, 10);
    if (hour > 23 || minute > 59 || second > 59) {
      return undefined;
    }
    const [millisecond, nanos] = fractionToMillisAndNanos(fraction);
    return EpochTimestamp.fromFields(
      { year, month, day, hour, minute, second, millisecond },
      timeZone,
      keepNanos ? nanos : 0,
    );
  }
  return undefined;
};

/**
 * Placeholder text describing the canonical input format for a kind.
 */
export const temporalInputPlaceholder = (kind: TemporalKind) =>
  kind === "date"
    ? "yyyy-mm-dd"
    : kind === "time"
      ? "hh:mm:ss"
      : "yyyy-mm-dd hh:mm:ss";
