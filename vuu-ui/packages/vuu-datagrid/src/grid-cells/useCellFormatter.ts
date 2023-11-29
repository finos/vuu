import { isTypeDescriptor, roundDecimal } from "@finos/vuu-utils";
import {
  RuntimeColumnDescriptor,
  ColumnTypeFormatting,
} from "@finos/vuu-datagrid-types";
import { createElement, useRef } from "react";

const defaultFormatter = (value: unknown) =>
  value == null ? "" : typeof value === "string" ? value : value.toString();

const getFormatter = (column: RuntimeColumnDescriptor) => {
  if (isTypeDescriptor(column.type)) {
    const { name, formatting } = column.type;
    if (name === "number") {
      return numericFormatter(formatting, column.align);
    }
  }
  return defaultFormatter;
};

export const useCellFormatter = (column: RuntimeColumnDescriptor) => {
  const formatter = useRef(getFormatter(column));
  return [formatter.current];
};

const DEFAULT_NUMERIC_FORMATTING = {};

function numericFormatter(
  {
    alignOnDecimals = false,
    decimals = 4,
    zeroPad = false,
  }: ColumnTypeFormatting = DEFAULT_NUMERIC_FORMATTING,
  align: "left" | "right" = "right"
) {
  const props = { className: "num" };
  // eslint-disable-next-line react/display-name
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
    return createElement(
      "div",
      props,
      roundDecimal(number, align, decimals, zeroPad, alignOnDecimals)
    );
  };
}
