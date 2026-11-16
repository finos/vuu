/**
 * Shorthand suffixes accepted in numeric filter values, with the power of ten
 * each one represents. Matched case-insensitively.
 */
const SUFFIX_EXPONENTS: Record<string, number> = {
  k: 3,
  m: 6,
  b: 9,
  bn: 9,
  t: 12,
  tn: 12,
};

/** The suffixes used when formatting, largest first. */
const FORMAT_SUFFIXES: ReadonlyArray<[suffix: string, exponent: number]> = [
  ["tn", 12],
  ["bn", 9],
  ["m", 6],
  ["k", 3],
];

export const NUMERIC_SHORTHAND_ERROR = "Use a number with k, m, bn or tn";

const shorthandPattern = /^(.*?)\s*(k|m|bn|b|tn|t)$/i;
const thousandsPattern = /^[+-]?\d{1,3}(?:,\d{3})+(?:\.\d+)?$/;
const numberPattern = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;

/**
 * Parses the whole of the text as a number, unlike parseFloat which
 * accepts trailing junk e.g. '12abc'. Accepts thousands separators
 * (1,500), exponents (3e10) and the shorthand suffixes k, m, bn (or b) and
 * tn (or t), with an optional space before the suffix (30 bn). Returns
 * undefined if text is not a valid number, or not an integer when an integer
 * is required, e.g. 1.5k is accepted for an integer column, 1.2345k is not.
 */
export const parseNumericValue = (
  text: string,
  integerOnly: boolean,
): number | undefined => {
  let numberText = text.trim();
  let exponent = 0;

  const shorthandMatch = shorthandPattern.exec(numberText);
  if (shorthandMatch) {
    const [, mantissa, suffix] = shorthandMatch;
    numberText = mantissa;
    exponent = SUFFIX_EXPONENTS[suffix.toLowerCase()];
  }

  if (numberText.includes(",")) {
    if (!thousandsPattern.test(numberText)) {
      return undefined;
    }
    numberText = numberText.replace(/,/g, "");
  }

  if (!numberPattern.test(numberText)) {
    return undefined;
  }
  if (exponent !== 0 && /e/i.test(numberText)) {
    // 3e3k is not a number anyone means to type
    return undefined;
  }

  // Scaling via the exponent, rather than multiplying, keeps the result
  // exact, e.g 1.15m is 1150000, not 1150000.0000000002
  const value =
    exponent === 0 ? Number(numberText) : Number(`${numberText}e${exponent}`);
  if (!Number.isFinite(value) || (integerOnly && !Number.isInteger(value))) {
    return undefined;
  }
  return value;
};

/**
 * The shortest text that parseNumericValue reads back as exactly this value,
 * using a shorthand suffix where that is no longer than the plain number,
 * e.g 30000000000 is '30bn', 1250000 is '1.25m', 1234 is '1234'.
 */
export const formatNumericShorthand = (value: number): string => {
  const plain = `${value}`;
  if (!Number.isFinite(value) || plain.includes("e")) {
    return plain;
  }
  let shortest: string | undefined;
  const magnitude = Math.abs(value);
  for (const [suffix, exponent] of FORMAT_SUFFIXES) {
    if (magnitude >= 10 ** exponent) {
      const mantissa = Number(`${plain}e-${exponent}`);
      const shorthand = `${mantissa}${suffix}`;
      if (
        !shorthand.includes("e") &&
        Number(`${mantissa}e${exponent}`) === value &&
        (shortest === undefined || shorthand.length < shortest.length)
      ) {
        shortest = shorthand;
      }
    }
  }
  return shortest !== undefined && shortest.length <= plain.length
    ? shortest
    : plain;
};

/**
 * The value with thousands separators, as a hint of how typed text has
 * been read, e.g. '= 30,000,000,000'.
 */
export const formatNumericHint = (value: number) =>
  `= ${value.toLocaleString("en-US", { maximumFractionDigits: 20 })}`;

/**
 * Why text cannot be used as a numeric filter value, or undefined if it can
 * (or is empty).
 */
export const getNumericValueError = (
  text: string,
  integerOnly: boolean,
): string | undefined => {
  if (
    text.trim() === "" ||
    parseNumericValue(text, integerOnly) !== undefined
  ) {
    return undefined;
  } else if (integerOnly && parseNumericValue(text, false) !== undefined) {
    return "Enter a whole number";
  } else {
    return NUMERIC_SHORTHAND_ERROR;
  }
};

/** The hint shown while typing a valid numeric value, if any. */
export const getNumericValueHint = (
  text: string,
  integerOnly: boolean,
): string | undefined => {
  const value = parseNumericValue(text, integerOnly);
  return value === undefined ? undefined : formatNumericHint(value);
};
