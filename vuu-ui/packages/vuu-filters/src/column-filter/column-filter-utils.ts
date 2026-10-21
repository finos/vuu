import type {
  ColumnFilterOp,
  ColumnFilterValue,
  FilterContainerFilter,
} from "@vuu-ui/vuu-filter-types";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import {
  extractFilterForColumn,
  isBetweenFilter,
  isBetweenOperator,
  isNumericColumn,
  isSingleValueFilter,
  isTemporalColumn,
  isTextColumn,
} from "@vuu-ui/vuu-utils";
import {
  numericOperators,
  textOperators,
} from "../filter-clause/operator-picker/operator-utils";

export type SelectableColumnFilterOp = Exclude<ColumnFilterOp, "in">;

export const getColumnFilterOperators = (
  column: ColumnDescriptor,
  operators?: readonly SelectableColumnFilterOp[],
): readonly SelectableColumnFilterOp[] => {
  let supported: SelectableColumnFilterOp[];
  if (isTextColumn(column)) {
    supported = textOperators.filter((op) => op !== "in");
  } else if (
    isNumericColumn(column) ||
    isTemporalColumn(column) ||
    column.serverDataType?.startsWith("scaleddecimal")
  ) {
    supported = [...numericOperators, "between", "between-inclusive"];
  } else if (column.serverDataType === "boolean") {
    supported = ["=", "!="];
  } else {
    throw Error(`[ColumnFilter] unsupported column type for ${column.name}`);
  }
  if (operators) {
    if (
      operators.length === 0 ||
      operators.some((op) => !supported.includes(op))
    ) {
      throw Error(`[ColumnFilter] invalid operators for ${column.name}`);
    }
    return operators;
  }
  return supported.filter((op) => !isBetweenOperator(op));
};

export const getDefaultColumnFilterOperator = (
  operators: readonly SelectableColumnFilterOp[],
  operator?: ColumnFilterOp,
): SelectableColumnFilterOp => {
  const selected =
    operator === undefined
      ? (operators.find((op) => op === "=") ?? operators[0])
      : operators.find((op) => op === operator);
  if (selected === undefined) {
    throw Error(
      `[ColumnFilter] operator ${operator} is not in the configured operators`,
    );
  }
  return selected;
};

export const getColumnFilterOperator = (
  column: ColumnDescriptor,
  filter?: FilterContainerFilter,
): SelectableColumnFilterOp | undefined => {
  const clause = getColumnFilterClause(column, filter);
  if (isBetweenFilter(clause)) {
    return clause.filters[0].op === ">=" ? "between-inclusive" : "between";
  }
  if (isSingleValueFilter(clause)) {
    return clause.op;
  }
};

export const getColumnFilterClause = (
  column: ColumnDescriptor,
  filter?: FilterContainerFilter,
): FilterContainerFilter | undefined => {
  const clause = extractFilterForColumn(filter, column.name);
  return isSingleValueFilter(clause) || isBetweenFilter(clause)
    ? clause
    : undefined;
};

export const normalizeColumnFilterValue = (
  operator: ColumnFilterOp,
  value: ColumnFilterValue = "",
): ColumnFilterValue =>
  isBetweenOperator(operator)
    ? Array.isArray(value)
      ? value
      : [`${value}`, ""]
    : Array.isArray(value)
      ? value[0]
      : value;
