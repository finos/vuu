import { DatePattern, DateTimePattern, TimePattern } from "./types";

type DateTimeFormatConfig = {
  locale?: string;
  options: Intl.DateTimeFormatOptions;
  postProcessor?: (s: string) => string;
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
};

// Date format config
const baseDateFormatOptions: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
};
const formatConfigByDatePatterns: Record<DatePattern, DateTimeFormatConfig> = {
  "dd.mm.yyyy": {
    locale: "en-GB",
    options: { ...baseDateFormatOptions },
    postProcessor: (s) => s.replaceAll("/", "."),
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

const formatConfigByDateTimePatterns: Record<
  DateTimePattern,
  DateTimeFormatConfig
> = { ...formatConfigByDatePatterns, ...formatConfigByTimePatterns };

export function formatDate(pattern: DateTimePattern): (d: Date) => string {
  const { locale, options, postProcessor } =
    formatConfigByDateTimePatterns[pattern];
  const dateTimeFormat = Intl.DateTimeFormat(locale, options);

  return (d) => {
    const dateStr = dateTimeFormat.format(d);
    return postProcessor ? postProcessor(dateStr) : dateStr;
  };
}
