import { DateTimeDataValueDescriptor } from "@finos/vuu-data-types";
import {
  ColumnDescriptor,
  ColumnTypeFormatting,
  ColumnTypeValueMap,
  ValueFormatter,
} from "@finos/vuu-table-types";
import {
  isDateTimeDataValue,
  isMappedValueTypeRenderer,
  isTypeDescriptor,
} from "./column-utils";
import { dateTimePattern, formatDate } from "./date";
import { roundDecimal } from "./round-decimal";

export type ValueFormatters = {
  [key: string]: ValueFormatter;
};

const DEFAULT_NUMERIC_FORMAT: ColumnTypeFormatting = {};

export const defaultValueFormatter = (value: unknown) =>
  value == null ? "" : typeof value === "string" ? value : value.toString();

const dateFormatter = (column: DateTimeDataValueDescriptor) => {
  const pattern = dateTimePattern(column.type);
  const formatter = formatDate(pattern);

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
): ValueFormatter => {
  if (isDateTimeDataValue(column)) {
    return dateFormatter(column);
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
