import { ColumnDescriptor, TypeFormatting } from "@finos/vuu-datagrid-types";
import { roundDecimal } from "./round-decimal";
import {
  isDateTimeColumn,
  isDateColumn,
  isTypeDescriptor,
} from "./column-utils";
import { DateTimePattern, formatDate, isDateTimePattern } from "./date-utils";

export type ValueFormatter = (value: unknown) => string;
export type ValueFormatters = {
  [key: string]: ValueFormatter;
};

const DEFAULT_NUMERIC_FORMAT: TypeFormatting = {};

export const defaultValueFormatter = (value: unknown) =>
  value == null ? "" : typeof value === "string" ? value : value.toString();

export const dateFormatter = (column: ColumnDescriptor) => {
  const { type } = column;
  let pattern: DateTimePattern = "dd.mm.yyyy";
  if (isTypeDescriptor(type) && type.formatting) {
    if (isDateTimePattern(type.formatting.pattern)) {
      pattern = type.formatting.pattern;
    }
  }
  return (value: unknown) => {
    if (typeof value === "number" && value !== 0) {
      return formatDate(new Date(value), pattern);
    } else {
      return "";
    }
  };
};

export const numericFormatter = ({
  align = "right",
  type,
}: ColumnDescriptor) => {
  if (type === undefined || typeof type === "string") {
    return defaultValueFormatter;
  } else {
    const {
      alignOnDecimals = false,
      decimals,
      zeroPad = false,
    } = type.formatting ?? DEFAULT_NUMERIC_FORMAT;
    return (value: unknown) => {
      if (
        typeof value === "string" &&
        (value.startsWith("Σ") || value.startsWith("["))
      ) {
        return value;
      }
      const number =
        typeof value === "number"
          ? value
          : typeof value === "string"
          ? parseFloat(value)
          : undefined;
      return roundDecimal(number, align, decimals, zeroPad, alignOnDecimals);
    };
  }
};

export const getValueFormatter = (column: ColumnDescriptor): ValueFormatter => {
  if (isDateTimeColumn(column)) {
    return dateFormatter(column);
  }
  const { serverDataType } = column;
  if (serverDataType === "string" || serverDataType === "char") {
    return (value: unknown) => value as string;
  } else if (serverDataType === "double") {
    return numericFormatter(column);
  }
  return defaultValueFormatter;
};
