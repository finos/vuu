import {
  ColumnDescriptor,
  ColumnTypeValueMap,
  ColumnTypeFormatting,
  DateTimeColumnDescriptor,
  DateTimeTableAttributes,
} from "@finos/vuu-table-types";
import { roundDecimal } from "./round-decimal";
import {
  isDateTimeColumn,
  isTypeDescriptor,
  isMappedValueTypeRenderer,
} from "./column-utils";
import { formatDate } from "./date";
import { dateTimePattern } from "./date/helpers";

export type ValueFormatter = (value: unknown) => string;
export type ValueFormatters = {
  [key: string]: ValueFormatter;
};

const DEFAULT_NUMERIC_FORMAT: ColumnTypeFormatting = {};

export const defaultValueFormatter = (value: unknown) =>
  value == null ? "" : typeof value === "string" ? value : value.toString();

const dateFormatter = (
  column: DateTimeColumnDescriptor,
  opts?: DateTimeTableAttributes
) => {
  const pattern = dateTimePattern(column.type);
  const formatter = formatDate(pattern, opts);

  return (value: unknown) => {
    if (typeof value === "number" && value !== 0) {
      return formatter(new Date(value));
    } else {
      return "";
    }
  };
};

export const numericFormatter = ({
  align = "right",
  type,
}: Partial<ColumnDescriptor>) => {
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

const mapFormatter = (map: ColumnTypeValueMap) => {
  return (value: unknown) => {
    return map[value as string] ?? "";
  };
};

export const getValueFormatter = (
  column: ColumnDescriptor,
  serverDataType = column.serverDataType,
  opts?: DateTimeTableAttributes
): ValueFormatter => {
  if (isDateTimeColumn(column)) {
    return dateFormatter(column, opts);
  }

  const { type } = column;
  if (isTypeDescriptor(type) && isMappedValueTypeRenderer(type?.renderer)) {
    return mapFormatter(type.renderer.map);
  } else if (serverDataType === "string" || serverDataType === "char") {
    return (value: unknown) => value as string;
  } else if (serverDataType === "double") {
    return numericFormatter(column);
  }
  return defaultValueFormatter;
};
