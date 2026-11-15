import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { isTemporalColumn, isTextColumn } from "@vuu-ui/vuu-utils";

/**
 * Columns for which FilterClause has operators and a value editor. Other
 * column types, e.g. boolean, cannot be used in a filter clause.
 */
export const isFilterClauseColumn = (column: ColumnDescriptor) =>
  isTextColumn(column) ||
  isTemporalColumn(column) ||
  column.serverDataType === "int" ||
  column.serverDataType === "long" ||
  column.serverDataType === "double";
