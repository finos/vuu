import type {
  DataValueType,
  DateTimeDataValueDescriptor,
} from "@vuu-ui/vuu-data-types";
import type { TemporalKind } from "./temporal";
import { DateTimePattern, isDateTimePattern } from "./types";

export const defaultPatternsByType = {
  time: "hh:mm:ss",
  date: "dd.mm.yyyy",
} as const;

export const fallbackDateTimePattern: DateTimePattern = {
  date: defaultPatternsByType["date"],
  time: defaultPatternsByType["time"],
};

export const defaultDateTimePatternByKind: Record<
  TemporalKind,
  DateTimePattern
> = {
  date: { date: defaultPatternsByType.date },
  datetime: fallbackDateTimePattern,
  time: { time: defaultPatternsByType.time },
};

const kindFromType = (
  type?: DataValueType | DateTimeDataValueDescriptor["type"],
): TemporalKind | undefined => {
  const typeName = typeof type === "string" ? type : type?.name;
  return typeName === "time"
    ? "time"
    : typeName === "date"
      ? "date"
      : typeName === "date/time"
        ? "datetime"
        : undefined;
};

/**
 * Returns the DateTimePattern configured on the type (formatting.pattern), if
 * there is one. Otherwise, the default pattern for the temporal kind. If kind
 * is not provided, it is inferred from type name.
 */
export function dateTimePattern(
  type?: DataValueType | DateTimeDataValueDescriptor["type"],
  kind: TemporalKind | undefined = kindFromType(type),
): DateTimePattern {
  if (typeof type === "object" && type !== null) {
    if (type.formatting && isDateTimePattern(type.formatting.pattern)) {
      return type.formatting.pattern;
    }
  }
  return kind ? defaultDateTimePatternByKind[kind] : fallbackDateTimePattern;
}
