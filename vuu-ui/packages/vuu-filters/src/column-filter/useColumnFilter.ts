import { FilterOp } from "@vuu-ui/vuu-filter-types";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";

export type FilterValue = string | number;

export const assertValidValue = (
  { serverDataType: _ }: ColumnDescriptor,
  operator: FilterOp | "between",
  value?: FilterValue | FilterValue[],
) => {
  if (value !== undefined) {
    if (operator === "between") {
      if (!Array.isArray(value)) {
        throw Error(
          "[useColumnFilter] 'between operator requires array of two values'",
        );
      } else if (value.length !== 2) {
        throw Error(
          `[useColumnFilter] 'between operator requires two values, received ${value.length}'`,
        );
      } else if (typeof value[0] !== typeof value[1]) {
        throw Error(
          `[useColumnFilter] 'between operator values must be of same type, received ${typeof value[0]} and ${typeof value[1]}`,
        );
      }
    }
    // TODO validate value(s) against serverDataType
  }
};

export interface ColumnFilterHookProps {
  column: ColumnDescriptor;
  operator?: FilterOp | "between";
}

// export const useColumnFilter = ({
//   column,
//   operator = "=",
// }: ColumnFilterHookProps) => {};
