import {
  CalendarDate,
  CalendarDateTime,
  fromAbsolute,
  getLocalTimeZone,
  toCalendarDate,
  toZoned,
} from "@internationalized/date";
import type { DateStringISO, TimeString } from "./date-utils";

/**
 * 'local' (browser time zone), 'UTC' or any IANA time zone identifier.
 */
export type TimeZoneSpec = "local" | "UTC" | (string & {});

let defaultTimeZone: TimeZoneSpec = "local";

/**
 * Set the time zone used for temporal values where a column does not
 * specify one explicitly (formatting.timeZone). Default is 'local'.
 */
export const setDefaultTimeZone = (timeZone: TimeZoneSpec) => {
  defaultTimeZone = timeZone;
};
export const getDefaultTimeZone = () => defaultTimeZone;

/**
 * Resolve a TimeZoneSpec to an IANA time zone identifier.
 */
export const resolveTimeZone = (timeZone: TimeZoneSpec = defaultTimeZone) =>
  timeZone === "local" ? getLocalTimeZone() : timeZone;

export interface DateTimeFields {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
}

export const getDateTimeFields = (
  epochMillis: number,
  timeZone?: TimeZoneSpec,
): DateTimeFields => {
  const { year, month, day, hour, minute, second, millisecond } = fromAbsolute(
    epochMillis,
    resolveTimeZone(timeZone),
  );
  return { year, month, day, hour, minute, second, millisecond };
};

/**
 * Convert wall clock fields in the given time zone to epoch millis. Where the
 * wall clock time is ambiguous or does not exist (DST transitions), the
 * 'compatible' disambiguation strategy is used (same as Temporal / JS Date).
 */
export const fromDateTimeFields = (
  {
    year,
    month,
    day,
    hour = 0,
    minute = 0,
    second = 0,
    millisecond = 0,
  }: Partial<DateTimeFields> & Pick<DateTimeFields, "year" | "month" | "day">,
  timeZone?: TimeZoneSpec,
) =>
  toZoned(
    new CalendarDateTime(year, month, day, hour, minute, second, millisecond),
    resolveTimeZone(timeZone),
    "compatible",
  )
    .toDate()
    .getTime();

const calendarDateOf = (epochMillis: number, timeZone?: TimeZoneSpec) =>
  toCalendarDate(fromAbsolute(epochMillis, resolveTimeZone(timeZone)));

const startOfCalendarDay = (date: CalendarDate, timeZone?: TimeZoneSpec) =>
  toZoned(date, resolveTimeZone(timeZone)).toDate().getTime();

/**
 * Epoch millis of the start of the calendar day (in timeZone) that contains epochMillis.
 */
export const startOfDay = (epochMillis: number, timeZone?: TimeZoneSpec) =>
  startOfCalendarDay(calendarDateOf(epochMillis, timeZone), timeZone);

/**
 * Epoch millis of the start of the calendar day (in timeZone) following the day that
 * contains epochMillis. This is DST safe, the day may be 23, 24 or 25 hours long.
 */
export const startOfNextDay = (epochMillis: number, timeZone?: TimeZoneSpec) =>
  startOfCalendarDay(
    calendarDateOf(epochMillis, timeZone).add({ days: 1 }),
    timeZone,
  );

export const isStartOfDay = (epochMillis: number, timeZone?: TimeZoneSpec) =>
  startOfDay(epochMillis, timeZone) === epochMillis;

/**
 * A date to which a time of day can be applied. 'today' and 'yesterday' are
 * resolved at the point of use, so filters that use them remain relative.
 */
export type RelativeDate = "today" | "yesterday" | DateStringISO;

const isoDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

export const resolveRelativeDate = (
  date: RelativeDate | Date = "today",
  timeZone?: TimeZoneSpec,
): CalendarDate => {
  if (date instanceof Date) {
    return calendarDateOf(date.getTime(), timeZone);
  } else if (date === "today") {
    return calendarDateOf(Date.now(), timeZone);
  } else if (date === "yesterday") {
    return calendarDateOf(Date.now(), timeZone).subtract({ days: 1 });
  } else {
    const match = isoDatePattern.exec(date);
    if (match) {
      return new CalendarDate(
        parseInt(match[1]),
        parseInt(match[2]),
        parseInt(match[3]),
      );
    }
    throw Error(`[time-zone] invalid date ${date}`);
  }
};

/**
 * Epoch millis of the given time of day on the given date, in timeZone.
 */
export const timeOfDayToEpochMillis = (
  timeString: TimeString | `${TimeString}.${string}`,
  date: RelativeDate | Date = "today",
  timeZone?: TimeZoneSpec,
) => {
  const { year, month, day } = resolveRelativeDate(date, timeZone);
  const [hms, fraction = ""] = timeString.split(".");
  const [hour, minute, second] = hms.split(":").map((v) => parseInt(v, 10));
  const millisecond = parseInt(fraction.padEnd(3, "0").slice(0, 3), 10);
  return fromDateTimeFields(
    { year, month, day, hour, minute, second, millisecond },
    timeZone,
  );
};
