import type {
  ExtendedFilterOptions,
  ScaledDecimalFilterOptions,
  SingleValueFilterClause,
} from "@vuu-ui/vuu-filter-types";
import type { DataValueDescriptor } from "@vuu-ui/vuu-data-types";
import { isTypeDescriptor } from "../column-utils";
import { roundScaledDecimal } from "../round-decimal";

export type ScaledDecimalScale = ScaledDecimalFilterOptions["scale"];

/**
 * The decimal places displayed for a scaled decimal when the column type
 * provides formatting but no explicit decimals (see roundScaledDecimal).
 */
const DEFAULT_DISPLAY_DECIMALS = 4;

const scales: Record<string, ScaledDecimalScale> = {
  scaleddecimal2: 2,
  scaleddecimal4: 4,
  scaleddecimal6: 6,
  scaleddecimal8: 8,
};

export const getScaledDecimalScale = (
  serverDataType?: string,
): ScaledDecimalScale | undefined =>
  serverDataType === undefined ? undefined : scales[serverDataType];

const decimalPattern = /^-?(\d+(\.\d*)?|\.\d+)$/;

export const isValidDecimalString = (value: string) =>
  decimalPattern.test(value);

export const isScaledDecimalFilterOptions = (
  options?: ExtendedFilterOptions,
): options is ScaledDecimalFilterOptions => options?.type === "ScaledDecimal";

/**
 * A decimal (not exponential) string representation of a filter value.
 */
export const toDecimalString = (
  value: unknown,
  scale: ScaledDecimalScale,
): string => {
  if (typeof value === "number") {
    const text = `${value}`;
    return /e/i.test(text) ? value.toFixed(scale) : text;
  }
  return `${value}`;
};

/**
 * Convert a decimal string to its scaled integer representation. Digits beyond
 * the scale are truncated, as the Vuu server does.
 */
export const toScaledInteger = (
  value: string,
  scale: ScaledDecimalScale,
): bigint => {
  if (!isValidDecimalString(value)) {
    throw Error(`[scaled-decimal-filter] invalid decimal value '${value}'`);
  }
  const negative = value.startsWith("-");
  const [integral, fraction = ""] = (negative ? value.slice(1) : value).split(
    ".",
  );
  const magnitude = BigInt(
    (integral || "0") + fraction.slice(0, scale).padEnd(scale, "0"),
  );
  return negative ? -magnitude : magnitude;
};

/**
 * Convert a scaled integer to a decimal string with 'scale' decimal places,
 * the literal form in which scaled decimals are expressed in a filter query.
 */
export const fromScaledInteger = (
  value: bigint,
  scale: ScaledDecimalScale,
): string => {
  const negative = value < 0n;
  const digits = (negative ? -value : value)
    .toString()
    .padStart(scale + 1, "0");
  const literal = `${digits.slice(0, -scale)}.${digits.slice(-scale)}`;
  return negative ? `-${literal}` : literal;
};

/**
 * The filter options for a clause on a scaled decimal column, describing the
 * precision with which the column displays values. These mirror the formatting
 * rules of numericFormatter: a column with no type descriptor displays the full
 * value, a type descriptor with no decimals displays 4 decimal places.
 */
export const getScaledDecimalFilterOptions = (
  column: Pick<DataValueDescriptor, "serverDataType" | "type">,
): ScaledDecimalFilterOptions | undefined => {
  const scale = getScaledDecimalScale(column.serverDataType);
  if (scale === undefined) {
    return undefined;
  }
  if (isTypeDescriptor(column.type)) {
    const { decimals = DEFAULT_DISPLAY_DECIMALS, roundingRule = "round" } =
      column.type.formatting ?? {};
    return decimals < scale
      ? { type: "ScaledDecimal", scale, decimals, roundingRule }
      : { type: "ScaledDecimal", scale };
  }
  return { type: "ScaledDecimal", scale };
};

const countDecimals = (value: string) => value.split(".")[1]?.length ?? 0;

/**
 * The range of scaled integer values, inclusive at both ends, matched by a
 * filter value. A value with no more decimal places than are displayed matches
 * every value that displays as that value, e.g 1.23, displayed with 2 decimals,
 * rounded, matches [1.225, 1.235). Display rounding applies to the magnitude,
 * so -1.23 matches (-1.235, -1.225]. A value with more decimal places than are
 * displayed is matched at its own precision, by the same rounding rule, e.g
 * 1.234 matches [1.2335, 1.2345). A value with as many decimal places as the
 * column holds, or any value where every decimal is displayed, is matched exactly.
 */
export const getScaledDecimalMatchRange = (
  value: string,
  { scale, decimals, roundingRule = "round" }: ScaledDecimalFilterOptions,
): [bigint, bigint] => {
  const scaledValue = toScaledInteger(value, scale);
  const precision =
    decimals === undefined ? scale : Math.max(decimals, countDecimals(value));
  if (precision >= scale) {
    return [scaledValue, scaledValue];
  }
  const step = 10n ** BigInt(scale - precision);
  if (roundingRule === "truncate") {
    if (scaledValue > 0n) {
      return [scaledValue, scaledValue + step - 1n];
    } else if (scaledValue < 0n) {
      return [scaledValue - step + 1n, scaledValue];
    } else {
      return [-step + 1n, step - 1n];
    }
  } else {
    const half = step / 2n;
    if (scaledValue > 0n) {
      return [scaledValue - half, scaledValue + half - 1n];
    } else if (scaledValue < 0n) {
      return [scaledValue - half + 1n, scaledValue + half];
    } else {
      return [-half + 1n, half - 1n];
    }
  }
};

/**
 * Serialize a filter clause on a scaled decimal column. Where the value matches
 * a range of values (see getScaledDecimalMatchRange), each operator applies to
 * that range, e.g '>' matches values greater than every value in the range.
 * Note: '!=' on a range is expressed as '< from or > to', which, unlike an
 * exact '!=', does not match a null value.
 */
export const scaledDecimalFilterAsQuery = (
  {
    column,
    op,
    value,
  }: Pick<SingleValueFilterClause, "column" | "op" | "value">,
  options: ScaledDecimalFilterOptions,
): string => {
  const { scale } = options;
  const [from, to] = getScaledDecimalMatchRange(
    toDecimalString(value, scale),
    options,
  );
  const lo = fromScaledInteger(from, scale);
  const hi = fromScaledInteger(to, scale);
  if (from === to) {
    return `${column} ${op} ${lo}`;
  }
  switch (op) {
    case "=":
      return `(${column} >= ${lo} and ${column} <= ${hi})`;
    case "!=":
      return `(${column} < ${lo} or ${column} > ${hi})`;
    case ">":
      return `${column} > ${hi}`;
    case ">=":
      return `${column} >= ${lo}`;
    case "<":
      return `${column} < ${lo}`;
    case "<=":
      return `${column} <= ${hi}`;
    default:
      throw Error(
        `[scaled-decimal-filter] operator ${op} is not supported for scaled decimals`,
      );
  }
};

export interface ScaledDecimalCellFilter {
  /** The value as displayed */
  label: string;
  op: "=";
  value: string;
}

/**
 * The filter for a cell value on a scaled decimal column, matching the value as
 * displayed, e.g a cell displaying 1.23 (underlying value 1.234567) creates a
 * filter matching every value that displays as 1.23.
 */
export const getScaledDecimalCellFilter = (
  column: Pick<DataValueDescriptor, "serverDataType" | "type">,
  value: unknown,
): ScaledDecimalCellFilter | undefined => {
  const options = getScaledDecimalFilterOptions(column);
  if (options === undefined || typeof value !== "string" || value === "") {
    return undefined;
  }
  const { decimals, roundingRule } = options;
  if (decimals === undefined) {
    return { label: value, op: "=", value };
  }
  const display = (useLocaleString: boolean) =>
    roundScaledDecimal(
      value,
      undefined,
      decimals,
      true,
      false,
      useLocaleString,
      roundingRule,
    );
  // The label matches the Table display, the value has no digit grouping
  return { label: display(true), op: "=", value: display(false) };
};
