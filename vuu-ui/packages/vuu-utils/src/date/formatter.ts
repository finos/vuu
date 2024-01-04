import { DateTimeTableAttributes } from "@finos/vuu-table-types";
import { DatePattern, DateTimePattern, TimePattern } from "./types";
import {
  validateLocaleOrGetDefault,
  validateTimeZoneOrGetDefault,
} from "./locale-and-timezone";

// Time format config
const baseTimeFormatConfig: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
};
const formatConfigByTimePatterns: Record<
  TimePattern,
  Intl.DateTimeFormatOptions
> = {
  "hh:mm:ss": { ...baseTimeFormatConfig, hour12: false },
  "hh:mm:ss a": { ...baseTimeFormatConfig, hour12: true },
};

// Date format config
const baseDateFormatConfig: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
};
const formatConfigByDatePatterns: Record<
  DatePattern,
  Intl.DateTimeFormatOptions
> = {
  ddmmyyyy: { ...baseDateFormatConfig },
  ddMMMyyyy: { ...baseDateFormatConfig, month: "short" },
  ddMMMMyyyy: { ...baseDateFormatConfig, month: "long" },
};

function getFormatConfig(pattern: DateTimePattern) {
  if (!pattern.date) {
    return formatConfigByTimePatterns[pattern.time];
  } else if (!pattern.time) {
    return formatConfigByDatePatterns[pattern.date];
  } else {
    return {
      ...formatConfigByDatePatterns[pattern.date],
      ...formatConfigByTimePatterns[pattern.time],
    };
  }
}

export function formatDate(
  pattern: DateTimePattern,
  { locale, timeZone }: DateTimeTableAttributes = {}
): (d: Date) => string {
  const formatConfig = getFormatConfig(pattern);
  const validatedLocale = validateLocaleOrGetDefault(locale);
  const validatedTimeZone = validateTimeZoneOrGetDefault(timeZone);

  const dateTimeFormat = Intl.DateTimeFormat(validatedLocale, {
    ...formatConfig,
    timeZoneName: !!pattern.showTimeZone ? "short" : undefined,
    timeZone: validatedTimeZone,
  });

  return dateTimeFormat.format;
}
