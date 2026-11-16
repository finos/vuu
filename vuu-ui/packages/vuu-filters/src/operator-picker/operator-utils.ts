import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import {
  isNumericColumn,
  isTextColumn,
  isTemporalColumn,
} from "@vuu-ui/vuu-utils";
import type {
  FilterClauseOp,
  NumericFilterClauseOp,
} from "@vuu-ui/vuu-filter-types";

export const textOperators: FilterClauseOp[] = [
  "=",
  "in",
  "!=",
  "starts",
  "ends",
  "contains",
];
export const numericOperators: NumericFilterClauseOp[] = [
  "=",
  "!=",
  ">",
  ">=",
  "<",
  "<=",
];

export const getOperators = (column: ColumnDescriptor): FilterClauseOp[] => {
  if (isTextColumn(column)) {
    return textOperators;
  } else if (isNumericColumn(column) || isTemporalColumn(column)) {
    return numericOperators;
  } else {
    throw Error("getOperators only supports text and numeric columns");
  }
};
