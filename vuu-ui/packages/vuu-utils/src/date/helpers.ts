import { DateTimeColumnDescriptor } from "@finos/vuu-table-types";
import { isTypeDescriptor } from "../column-utils";
import { DateTimePattern, isDateTimePattern } from "./types";

export const defaultPatternsByType = {
  time: "hh:mm:ss",
  date: "ddmmyyyy",
} as const;

export const fallbackDateTimePattern: DateTimePattern = {
  date: defaultPatternsByType["date"],
};

export function dateTimePattern(
  type: DateTimeColumnDescriptor["type"]
): DateTimePattern {
  if (isTypeDescriptor(type)) {
    if (type.formatting && isDateTimePattern(type.formatting.pattern)) {
      return type.formatting.pattern;
    }
  }

  return fallbackDateTimePattern;
}
