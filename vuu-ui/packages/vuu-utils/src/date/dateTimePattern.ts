import type {
  DataValueDescriptor,
  DataValueType,
  DateTimeDataValueDescriptor,
  TemporalDataValueTypeSimple,
} from "@vuu-ui/vuu-data-types";
import { getTemporalInfo, type TemporalKind } from "./temporal";
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

/**
 * Returns a copy of a temporal descriptor, with its type replaced so that the
 * value is displayed (or edited) using the given pattern. The type name follows
 * the pattern: 'date/time' if both date and time are specified, else 'date' or
 * 'time'. Other formatting (e.g. timeZone, locale) is preserved. The descriptor
 * is returned unchanged if no pattern is provided or the descriptor is not
 * temporal.
 * Use this to present a column differently in different contexts, e.g. a
 * ColumnFilter using a different pattern to the Table.
 */
export const withDateTimePattern = <T extends DataValueDescriptor>(
  descriptor: T,
  pattern?: DateTimePattern,
): T => {
  if (pattern === undefined || getTemporalInfo(descriptor) === undefined) {
    return descriptor;
  }
  const name: TemporalDataValueTypeSimple =
    pattern.date && pattern.time ? "date/time" : pattern.date ? "date" : "time";
  const formatting =
    typeof descriptor.type === "object"
      ? descriptor.type.formatting
      : undefined;
  return {
    ...descriptor,
    type: { name, formatting: { ...formatting, pattern } },
  };
};
