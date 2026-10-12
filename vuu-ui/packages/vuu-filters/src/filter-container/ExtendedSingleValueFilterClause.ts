import type {
  ExtendedFilterOptions,
  SerializableSingleValueFilterClause,
  SingleValueFilterClauseOp,
  TimeTodayFilterOptions,
} from "@vuu-ui/vuu-filter-types";
import { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import {
  getDefaultTimeZone,
  isValidTimeString,
  type RelativeDate,
  temporalFilterAsQuery,
  type TemporalInfo,
} from "@vuu-ui/vuu-utils";

export const isTimeToday = (
  options: ExtendedFilterOptions,
): options is TimeTodayFilterOptions =>
  options.type === "TimeString" && options.date === "today";

export interface SerializableFilter {
  asQuery: () => string;
}

const timeStringWithFraction = /^\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?$/;

/**
 * A filter clause on a time of day value (TimeString). The time is resolved
 * against a date ('today' by default) only when the query is created, so a
 * persisted filter remains relative.
 */
export class ExtendedSingleValueFilterClause
  implements SerializableSingleValueFilterClause
{
  #options: ExtendedFilterOptions;

  constructor(
    public column: string,
    public op: SingleValueFilterClauseOp,
    public value: VuuRowDataItemType,
    extendedOptions: ExtendedFilterOptions,
  ) {
    this.#options = extendedOptions;
  }
  name?: string | undefined;

  get extendedOptions() {
    return this.#options;
  }

  asQuery() {
    const { column, op, value } = this;
    const { date, encoding = "epochMillis", timeZone } = this.#options;
    if (this.#options.type === "TimeString") {
      if (
        typeof value === "string" &&
        (isValidTimeString(value) || timeStringWithFraction.test(value))
      ) {
        const temporalInfo: TemporalInfo = {
          kind: "time",
          encoding,
          precision: encoding === "epochNanos" ? "ns" : "ms",
          timeZone: timeZone ?? getDefaultTimeZone(),
        };
        return temporalFilterAsQuery({ column, op, value }, temporalInfo, {
          date: date as RelativeDate,
        });
      } else {
        throw Error(
          `[ExtendedSingleValueFilterClause] invalid TimeString ${value}`,
        );
      }
    } else {
      throw Error(
        "[ExtendedSingleValueFilterClause] unhandled extended filter type",
      );
    }
  }

  toJSON() {
    const { column, op, value } = this;
    return {
      column,
      op,
      value,
      extendedOptions: this.#options,
    };
  }
}
