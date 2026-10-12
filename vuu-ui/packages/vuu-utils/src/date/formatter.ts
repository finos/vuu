import { DateFormatter } from "@internationalized/date";
import type { FractionalSecondDigits } from "@vuu-ui/vuu-table-types";
import { EpochTimestamp } from "./EpochTimestamp";
import { resolveTimeZone, type TimeZoneSpec } from "./time-zone";
import { DatePattern, DateTimePattern, TimePattern } from "./types";

type DateTimeFormatConfig = {
  locale: string;
  options: Intl.DateTimeFormatOptions;
};

export interface DateTimeFormatOptions {
  /**
   * Number of sub-second digits to display, when pattern includes time. If
   * not specified, 3 is used for the 'hh:mm:ss.ms' pattern, otherwise 0.
   */
  fractionalSecondDigits?: FractionalSecondDigits;
  /**
   * Override the locale implied by the pattern. Pattern then determines the
   * style of each field, locale determines order and language.
   */
  locale?: string;
  timeZone?: TimeZoneSpec;
}

// Time format config
const baseTimeFormatOptions: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
};
const formatConfigByTimePatterns: Record<TimePattern, DateTimeFormatConfig> = {
  "hh:mm:ss": {
    locale: "en-GB",
    options: { ...baseTimeFormatOptions, hour12: false },
  },
  "hh:mm:ss a": {
    locale: "en-GB",
    options: { ...baseTimeFormatOptions, hour12: true },
  },
  "hh:mm:ss.ms": {
    locale: "en-GB",
    options: { ...baseTimeFormatOptions, hour12: false },
  },
};

// Date format config
const baseDateFormatOptions: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
};
const formatConfigByDatePatterns: Record<
  Exclude<DatePattern, "yyyy-mm-dd">,
  DateTimeFormatConfig
> = {
  "dd.mm.yyyy": {
    locale: "de-De",
    options: { ...baseDateFormatOptions },
  },
  "dd/mm/yyyy": { locale: "en-GB", options: { ...baseDateFormatOptions } },
  "dd MMM yyyy": {
    locale: "en-GB",
    options: { ...baseDateFormatOptions, month: "short" },
  },
  "dd MMMM yyyy": {
    locale: "en-GB",
    options: { ...baseDateFormatOptions, month: "long" },
  },
  "mm/dd/yyyy": { locale: "en-US", options: { ...baseDateFormatOptions } },
  "MMM dd, yyyy": {
    locale: "en-US",
    options: { ...baseDateFormatOptions, month: "short" },
  },
  "MMMM dd, yyyy": {
    locale: "en-US",
    options: { ...baseDateFormatOptions, month: "long" },
  },
};

const NARROW_NBSP = /\u202f/g;

type TimestampFormatter = (ts: EpochTimestamp) => string;

const intlFormatterCache = new Map<string, Intl.DateTimeFormat>();
const getIntlFormatter = (
  locale: string,
  options: Intl.DateTimeFormatOptions,
) => {
  const key = `${locale}:${JSON.stringify(options)}`;
  let formatter = intlFormatterCache.get(key);
  if (formatter === undefined) {
    formatter = new Intl.DateTimeFormat(locale, options);
    intlFormatterCache.set(key, formatter);
  }
  return formatter;
};

const isoDateFormatter = (timeZone: string): TimestampFormatter => {
  const formatter = getIntlFormatter("en-GB", {
    ...baseDateFormatOptions,
    month: "2-digit",
    timeZone,
  });
  return (ts) => {
    const parts = formatter.formatToParts(ts.toDate());
    const get = (type: Intl.DateTimeFormatPart["type"]) =>
      parts.find((p) => p.type === type)?.value ?? "";
    return `${get("year")}-${get("month")}-${get("day")}`;
  };
};

const dateFormatter = (
  pattern: Exclude<DatePattern, "yyyy-mm-dd">,
  timeZone: string,
  localeOverride?: string,
): TimestampFormatter => {
  const { locale, options } = formatConfigByDatePatterns[pattern];
  const formatter = getIntlFormatter(localeOverride ?? locale, {
    ...options,
    timeZone,
  });
  return (ts) => formatter.format(ts.toDate());
};

const timeFormatter = (
  pattern: TimePattern,
  timeZone: string,
  fractionalSecondDigits: number,
  localeOverride?: string,
): TimestampFormatter => {
  const { locale, options } = formatConfigByTimePatterns[pattern];
  const formatter = getIntlFormatter(localeOverride ?? locale, {
    ...options,
    timeZone,
  });
  // We don't use Intl fractionalSecondDigits, it supports a max of 3 digits
  // and rounds rather than truncates.
  return (ts) =>
    formatter
      .formatToParts(ts.toDate())
      .map(({ type, value }) =>
        type === "second" && fractionalSecondDigits > 0
          ? `${value}.${ts.fractionalSecond(fractionalSecondDigits)}`
          : // formatToParts may use narrow no-break space, format does not
            value.replace(NARROW_NBSP, " "),
      )
      .join("");
};

/**
 * Create a formatter for EpochTimestamp values. This is the most general
 * formatter, it supports nanosecond precision.
 */
export function formatTimestamp(
  { date, time }: DateTimePattern,
  {
    fractionalSecondDigits = time === "hh:mm:ss.ms" ? 3 : 0,
    locale,
    timeZone,
  }: DateTimeFormatOptions = {},
): TimestampFormatter {
  const tz = resolveTimeZone(timeZone);
  const formatters: TimestampFormatter[] = [];
  if (date === "yyyy-mm-dd") {
    formatters.push(isoDateFormatter(tz));
  } else if (date) {
    formatters.push(dateFormatter(date, tz, locale));
  }
  if (time) {
    formatters.push(timeFormatter(time, tz, fractionalSecondDigits, locale));
  }
  return (ts) => formatters.map((f) => f(ts)).join(" ");
}

/**
 * Create a formatter for Date values.
 */
export function formatDate(
  pattern: DateTimePattern,
  options?: DateTimeFormatOptions,
): (d: Date) => string {
  const formatter = formatTimestamp(pattern, options);
  return (d) => formatter(EpochTimestamp.fromDate(d));
}

export function getDateFormatter({ locale, options }: DateTimeFormatConfig) {
  return new DateFormatter(locale, options);
}
