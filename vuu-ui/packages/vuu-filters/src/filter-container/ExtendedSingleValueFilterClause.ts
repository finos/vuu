import type {
  ExtendedFilterOptions,
  SerializableSingleValueFilterClause,
  SingleValueFilterClauseOp,
  TimeTodayFilterOptions,
} from "@vuu-ui/vuu-filter-types";
import { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { isValidTimeString, Time } from "@vuu-ui/vuu-utils";

export const isTimeToday = (
  options: ExtendedFilterOptions,
): options is TimeTodayFilterOptions =>
  options.type === "TimeString" && options.date === "today";

export interface SerializableFilter {
  asQuery: () => string;
}

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

  asQuery() {
    const { column, op, value } = this;
    if (isTimeToday(this.#options)) {
      if (isValidTimeString(value)) {
        const timeValue = +Time(value).asDate();
        if (op === ">=") {
          return `${column} > ${timeValue - 1}`;
        } else if (op === "<=") {
          return `${column} < ${timeValue + 1}`;
        } else {
          return `${column} ${op} ${timeValue}`;
        }
      } else {
        throw Error(
          `[ExtendedSingleValueFilterClause] invalid TimeStrong ${value}`,
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
