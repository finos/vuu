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

export type DatePattern = (typeof supportedDatePatterns)[number];
export type TimePattern = (typeof supportedTimePatterns)[number];
export type DateTimePattern = DatePattern | TimePattern;

const isDatePattern = (pattern: string): pattern is DatePattern =>
  supportedDatePatterns.includes(pattern as DatePattern);

const isTimePattern = (pattern: string): pattern is TimePattern =>
  supportedTimePatterns.includes(pattern as TimePattern);

export const isDateTimePattern = (
  pattern?: string
): pattern is DateTimePattern =>
  pattern !== undefined && (isDatePattern(pattern) || isTimePattern(pattern));
