import { ColumnTypeFormatting } from "@finos/vuu-table-types";

const supportedDatePatterns = [
  "dd.mm.yyyy",
  "dd/mm/yyyy",
  "dd MMM yyyy",
  "dd MMMM yyyy",
  "mm/dd/yyyy",
  "MMM dd, yyyy",
  "MMMM dd, yyyy",
] as const;

const supportedTimePatterns = ["hh:mm:ss", "hh:mm:ss a"] as const;

export const supportedDateTimePatterns = {
  date: supportedDatePatterns,
  time: supportedTimePatterns,
};

export type DatePattern = (typeof supportedDatePatterns)[number];
export type TimePattern = (typeof supportedTimePatterns)[number];

export type DateTimePattern =
  | { date?: DatePattern; time: TimePattern }
  | { date: DatePattern; time?: TimePattern };

const isDatePattern = (pattern?: string): pattern is DatePattern =>
  supportedDatePatterns.includes(pattern as DatePattern);

const isTimePattern = (pattern?: string): pattern is TimePattern =>
  supportedTimePatterns.includes(pattern as TimePattern);

export const isDateTimePattern = (
  pattern?: ColumnTypeFormatting["pattern"]
): pattern is DateTimePattern =>
  isDatePattern(pattern?.date) || isTimePattern(pattern?.time);
