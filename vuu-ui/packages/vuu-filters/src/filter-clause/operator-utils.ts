import { ColumnDescriptor } from "@finos/vuu-table-types";
import { isNumericColumn, isTextColumn } from "@finos/vuu-utils";

export const textOperators = ["=", "in", "!=", "starts", "ends"];
export const numericperators = ["=", "!=", ">", ">=", "<", "<="];

export const getOperators = (column: ColumnDescriptor): string[] => {
  if (isTextColumn(column)) {
    return textOperators;
  } else if (isNumericColumn(column)) {
    return numericperators;
  } else {
    throw Error("getOperators only supports text and numeric columns");
  }
};
