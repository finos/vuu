import { ColumnTypeFormatting } from "@vuu-ui/vuu-table-types";

/**
 * In the code below we distinguish between an ISO date pattern (yyyy-mm-dd) and
 * other supported date patterns because the ISO format is not supported by the
 * Intl dateFormatting function
 */
const supportedDatePatterns = [
  "yyyy-mm-dd",
  "dd.mm.yyyy",
  "dd/mm/yyyy",
  "dd MMM yyyy",
  "dd MMMM yyyy",
  "mm/dd/yyyy",
  "MMM dd, yyyy",
  "MMMM dd, yyyy",
] as const;

const supportedTimePatterns = [
  "hh:mm:ss",
  "hh:mm:ss a",
  "hh:mm:ss.ms",
] as const;

export const supportedDateTimePatterns = {
  date: supportedDatePatterns,
  time: supportedTimePatterns,
};
export const dateTimeLabelByType = { date: "Date", time: "Time" } as const;

export type DatePattern = (typeof supportedDatePatterns)[number];
export type TimePattern = (typeof supportedTimePatterns)[number];

export type DateTimePattern =
  | { date?: DatePattern; time: TimePattern }
  | { date: DatePattern; time?: TimePattern };

export const isDatePattern = (pattern?: string): pattern is DatePattern =>
  supportedDatePatterns.includes(pattern as DatePattern);

export const isTimePattern = (pattern?: string): pattern is TimePattern =>
  supportedTimePatterns.includes(pattern as TimePattern);

export const isDateTimePattern = (
  pattern?: ColumnTypeFormatting["pattern"],
): pattern is DateTimePattern =>
  isDatePattern(pattern?.date) || isTimePattern(pattern?.time);
