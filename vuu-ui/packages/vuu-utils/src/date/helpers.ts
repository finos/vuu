import { DateTimeColumnTypeSimple } from "@finos/vuu-table-types";
import { DateTimeColumnDescriptor, isTypeDescriptor } from "../column-utils";
import { DateTimePattern, isDateTimePattern } from "./types";

export const defaultPatternByTypes: Record<
  DateTimeColumnTypeSimple,
  DateTimePattern
> = { time: "hh:mm:ss", date: "dd.mm.yyyy" };

export function dateTimePattern(
  type: DateTimeColumnDescriptor["type"]
): DateTimePattern {
  if (isTypeDescriptor(type)) {
    if (type.formatting && isDateTimePattern(type.formatting.pattern)) {
      return type.formatting.pattern;
    }

    return defaultPatternByTypes[type.name];
  } else {
    return defaultPatternByTypes[type];
  }
}
