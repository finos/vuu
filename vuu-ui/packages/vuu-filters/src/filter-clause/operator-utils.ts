import type { ColumnDescriptor } from "@finos/vuu-table-types";
import { isNumericColumn, isTextColumn } from "@finos/vuu-utils";
import type {
  FilterClauseOp,
  NumericFilterClauseOp,
} from "@finos/vuu-filter-types";

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
  } else if (isNumericColumn(column)) {
    return numericOperators;
  } else {
    throw Error("getOperators only supports text and numeric columns");
  }
};
