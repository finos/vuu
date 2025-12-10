import { DateTimeDataValueDescriptor } from "@vuu-ui/vuu-data-types";
import { isTypeDescriptor } from "../column-utils";
import { DateTimePattern, isDateTimePattern } from "./types";

export const defaultPatternsByType = {
  time: "hh:mm:ss",
  date: "dd.mm.yyyy",
} as const;

export const fallbackDateTimePattern: DateTimePattern = {
  date: defaultPatternsByType["date"],
  time: defaultPatternsByType["time"],
};

export function dateTimePattern(
  type: DateTimeDataValueDescriptor["type"],
): DateTimePattern {
  if (isTypeDescriptor(type)) {
    if (type.formatting && isDateTimePattern(type.formatting.pattern)) {
      return type.formatting.pattern;
    }
  }

  return fallbackDateTimePattern;
}
