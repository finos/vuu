import { DataValueDescriptor } from "@vuu-ui/vuu-data-types";
import {
  ColumnDescriptor,
  ColumnTypeFormatting,
  ColumnTypeValueMap,
  ValueFormatter,
} from "@vuu-ui/vuu-table-types";
import {
  isDateTimeDataValue,
  isMappedValueTypeRenderer,
  isTypeDescriptor,
} from "./column-utils";
import { dateTimePattern, formatDate } from "./date";
import { roundDecimal, roundScaledDecimal } from "./round-decimal";
import { isNumericType } from "./protocol-message-utils";

export type ValueFormatters = {
  [key: string]: ValueFormatter;
};

const DEFAULT_NUMERIC_FORMAT: ColumnTypeFormatting = {};

export const defaultValueFormatter = (value: unknown) =>
  value == null ? "" : typeof value === "string" ? value : value.toString();

const dateFormatter = (column: DataValueDescriptor) => {
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
  serverDataType,
  type,
}: Partial<ColumnDescriptor>) => {
  if (type === undefined || typeof type === "string") {
    return defaultValueFormatter;
  } else {
    const {
      alignOnDecimals = false,
      decimals,
      roundingRule,
      useLocaleString,
      zeroPad = false,
    } = type.formatting ?? DEFAULT_NUMERIC_FORMAT;
    return (value: unknown) => {
      if (serverDataType?.startsWith("scaleddecimal")) {
        if (typeof value === "string") {
          return roundScaledDecimal(
            value,
            align,
            decimals,
            zeroPad,
            alignOnDecimals,
            useLocaleString,
            roundingRule,
          );
        } else {
          throw Error(
            `[formatting-utils] numericFormatter, invalid data for ${serverDataType}: '${value}'`,
          );
        }
      }
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
      return roundDecimal(
        number,
        align,
        decimals,
        zeroPad,
        alignOnDecimals,
        useLocaleString,
        roundingRule,
      );
    };
  }
};

const mapFormatter = (map: ColumnTypeValueMap) => {
  return (value: unknown) => {
    return map[value as string] ?? "";
  };
};

const NumericTypes = ["decimal", "number"];

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
  } else if (
    isNumericType(serverDataType) ||
    (isTypeDescriptor(type) && NumericTypes.includes(type.name))
  ) {
    return numericFormatter(column);
  } else if (serverDataType === "string" || serverDataType === "char") {
    return (value: unknown) => value as string;
  }
  return defaultValueFormatter;
};

/**
 * Lowercases a string and returns as Lowercase typescript type
 *
 * @param str the input string
 * @returns str converted to Lowercase
 */
export const lowerCase = (str: string) =>
  str.toLowerCase() as Lowercase<string>;
