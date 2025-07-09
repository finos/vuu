import { DateFormatter } from "@internationalized/date";
import { isNotNullOrUndefined } from "../ts-utils";
import { DatePattern, DateTimePattern, TimePattern } from "./types";

type DateTimeFormatConfig = {
  locale: string;
  options: Intl.DateTimeFormatOptions;
};

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
    options: {
      ...baseTimeFormatOptions,
      hour12: false,
      fractionalSecondDigits: 3,
    },
  },
};

// Date format config
const baseDateFormatOptions: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
};
const formatConfigByDatePatterns: Record<DatePattern, DateTimeFormatConfig> = {
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

function getFormatConfigs(pattern: DateTimePattern) {
  return [
    pattern.date ? formatConfigByDatePatterns[pattern.date] : null,
    pattern.time ? formatConfigByTimePatterns[pattern.time] : null,
  ];
}

export function formatDate(pattern: DateTimePattern): (d: Date) => string {
  const formatters = getFormatConfigs(pattern)
    .filter(isNotNullOrUndefined)
    .map((c) => getDateFormatter(c.locale, c.options));

  return (d) => formatters.map((f) => f.format(d)).join(" ");
}

export function getDateFormatter(
  locale: string,
  options?: Intl.DateTimeFormatOptions,
) {
  return new DateFormatter(locale, options);
}
