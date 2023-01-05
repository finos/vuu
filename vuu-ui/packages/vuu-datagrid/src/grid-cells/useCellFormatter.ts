import { roundDecimal } from "@finos/vuu-utils";
import { TypeFormatting } from "@finos/vuu-datagrid-types";
import { createElement, useRef } from "react";
import { isTypeDescriptor, KeyedColumnDescriptor } from "../grid-model";

const defaultFormatter = (value: unknown) => (value == null ? "" : value);

const getFormatter = (column: KeyedColumnDescriptor) => {
  if (isTypeDescriptor(column.type)) {
    const { name, formatting } = column.type;
    if (name === "number") {
      return numericFormatter(formatting);
    }
  }
  return defaultFormatter;
};

export const useCellFormatter = (column: KeyedColumnDescriptor) => {
  const formatter = useRef(getFormatter(column));
  return [formatter.current];
};

const DEFAULT_NUMERIC_FORMATTING = {};

function numericFormatter({
  align = "right",
  alignOnDecimals = false,
  decimals = 4,
  zeroPad = false,
}: TypeFormatting = DEFAULT_NUMERIC_FORMATTING) {
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
