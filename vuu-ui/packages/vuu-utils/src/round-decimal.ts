import { RoundingRule } from "@vuu-ui/vuu-table-types";

const PUNCTUATION_STR = String.fromCharCode(8200);
const DIGIT_STR = String.fromCharCode(8199);
const DECIMALS_AUTO = -1;

/**
 * Formats with the default locale and options, the same output as
 * Number.prototype.toLocaleString(), which sets up locale formatting on
 * every call and is about 30x slower. The locale is read once, when this
 * module loads, so a change to the default locale at runtime is not picked
 * up until the page is reloaded.
 */
const integerFormat = new Intl.NumberFormat();
const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER.toString();
const MAX_INTEGER_DIGITS = MAX_SAFE_INTEGER.length;

export const exceedsMaxSafeInteger = (value: string) =>
  value.length > MAX_INTEGER_DIGITS ||
  (value.length === MAX_INTEGER_DIGITS && value > MAX_SAFE_INTEGER);

/**
 * Round the digits of a fraction, half up, to the given number of decimals.
 * Done on the digits rather than with toFixed, which misrounds values that
 * are not exactly representable as a double (e.g 0.235 to 0.23).
 * Returns the rounded digits and whether rounding carries into the integral.
 */
const roundFraction = (
  fraction: string,
  decimals: number,
): [digits: string, carry: boolean] => {
  const kept = fraction.slice(0, decimals);
  if (fraction.length <= decimals || fraction[decimals] < "5") {
    return [kept, false];
  } else if (decimals === 0) {
    return ["", true];
  }
  const rounded = (BigInt(kept) + 1n).toString().padStart(decimals, "0");
  return rounded.length > decimals
    ? [rounded.slice(1), true]
    : [rounded, false];
};

const carriesIntoIntegral = (
  fraction: string,
  decimals: number,
  roundingRule: RoundingRule,
) =>
  roundingRule === "round" &&
  decimals !== DECIMALS_AUTO &&
  fraction.length > decimals &&
  roundFraction(fraction, decimals)[1];

const incrementIntegral = (integral: string) => {
  const negative = integral.startsWith("-");
  const magnitude = BigInt(negative ? integral.slice(1) : integral) + 1n;
  return `${negative ? "-" : ""}${magnitude}`;
};

type PadMap = {
  DIGIT: string;
  TWO_DIGITS: string;
  THREE_DIGITS: string;
  FULL_PADDING: [null, string, string, string, string];
};

const Space: PadMap = {
  DIGIT: DIGIT_STR,
  TWO_DIGITS: DIGIT_STR + DIGIT_STR,
  THREE_DIGITS: DIGIT_STR + DIGIT_STR + DIGIT_STR,
  FULL_PADDING: [
    null,
    PUNCTUATION_STR + DIGIT_STR,
    PUNCTUATION_STR + DIGIT_STR + DIGIT_STR,
    PUNCTUATION_STR + DIGIT_STR + DIGIT_STR + DIGIT_STR,
    PUNCTUATION_STR + DIGIT_STR + DIGIT_STR + DIGIT_STR + DIGIT_STR,
  ],
};

const Zero: PadMap = {
  DIGIT: "0",
  TWO_DIGITS: "00",
  THREE_DIGITS: "000",
  FULL_PADDING: [null, "0", "00", "000", "0000"],
};

function padLeft(value: string, maxLength = 6) {
  return (LEADING_FILL + value).slice(-maxLength);
}

const LEADING_FILL =
  DIGIT_STR +
  DIGIT_STR +
  DIGIT_STR +
  DIGIT_STR +
  DIGIT_STR +
  DIGIT_STR +
  DIGIT_STR +
  DIGIT_STR +
  DIGIT_STR;

const Align = {
  Right: "right",
  Center: "center",
  Left: "left",
};

function pad(n: string, dp: number, Pad: PadMap): string {
  let len = n.length;
  const diff = dp - len;

  if (diff > 0) {
    if (diff === 1) {
      n = n + Pad.DIGIT;
    } else if (diff === 2) {
      n = n + Pad.TWO_DIGITS;
    } else if (diff === 3) {
      n = n + Pad.THREE_DIGITS;
    }
  } else {
    if (diff < 0) {
      n = n.slice(0, dp);
      len = dp;
    }

    if (Pad === Space && n.charAt(len - 1) === "0") {
      n = n.replace(/0+$/, "");
      return pad(n, dp, Pad);
    }
  }
  return n;
}

export function roundDecimal(
  value?: number,
  align = Align.Right,
  decimals = 4,
  zeroPad?: boolean,
  alignOnDecimals?: boolean,
  useLocaleString = true,
  roundingRule: RoundingRule = "round",
) {
  if (value === undefined || typeof value !== "number" || isNaN(value)) {
    return "";
  }
  let integral: string;
  let fraction: string;
  let Pad: PadMap | null;

  const [whole, part2 = ""] = value.toString().split(".");
  const part1 = carriesIntoIntegral(part2, decimals, roundingRule)
    ? incrementIntegral(whole)
    : whole;
  const actualDecimals = part2.length;

  integral =
    part1 === "-0"
      ? "-0"
      : useLocaleString
        ? integerFormat.format(parseFloat(part1))
        : parseFloat(part1).toString();

  if (align === Align.Left && alignOnDecimals) {
    integral = padLeft(integral);
  }

  if (decimals === DECIMALS_AUTO || actualDecimals === decimals) {
    fraction = part2;
  } else if (actualDecimals > decimals) {
    if (roundingRule === "round") {
      [fraction] = roundFraction(part2, decimals);
    } else {
      fraction = part2.slice(0, decimals);
    }
  } else {
    /* eslint-disable no-cond-assign */
    if (
      (Pad = zeroPad
        ? Zero
        : alignOnDecimals && align !== Align.Left
          ? Space
          : null)
    ) {
      if (actualDecimals === 0) {
        fraction = Pad.FULL_PADDING[decimals] ?? "";
      } else {
        fraction = pad(part2, decimals, Pad);
      }
    } else {
      fraction = part2;
    }
  }

  return integral + (fraction ? "." + fraction : "");
}

export function roundScaledDecimal(
  value: string,
  align = Align.Right,
  decimals = 4,
  zeroPad?: boolean,
  alignOnDecimals?: boolean,
  useLocaleString = true,
  roundingRule: RoundingRule = "round",
) {
  let integral: string;
  let fraction: string;
  let Pad: PadMap | null;

  // nulls are returned from server as empty string
  if (value === "") {
    return "";
  }

  const [whole, part2 = ""] = value.split(".");
  const part1 = carriesIntoIntegral(part2, decimals, roundingRule)
    ? incrementIntegral(whole)
    : whole;
  const actualDecimals = part2.length;

  integral =
    part1 === ""
      ? "0"
      : part1 === "-0"
        ? "-0"
        : useLocaleString
          ? exceedsMaxSafeInteger(value)
            ? integerFormat.format(BigInt(part1))
            : integerFormat.format(parseFloat(part1))
          : part1;

  if (align === Align.Left && alignOnDecimals) {
    integral = padLeft(integral);
  }

  if (decimals === DECIMALS_AUTO || actualDecimals === decimals) {
    fraction = part2;
  } else if (actualDecimals > decimals) {
    if (roundingRule === "round") {
      [fraction] = roundFraction(part2, decimals);
    } else {
      fraction = part2.slice(0, decimals);
    }
  } else {
    /* eslint-disable no-cond-assign */
    if (
      (Pad = zeroPad
        ? Zero
        : alignOnDecimals && align !== Align.Left
          ? Space
          : null)
    ) {
      if (actualDecimals === 0) {
        fraction = Pad.FULL_PADDING[decimals] ?? "";
      } else {
        fraction = pad(part2, decimals, Pad);
      }
    } else {
      fraction = part2;
    }
  }

  return integral + (fraction ? "." + fraction : "");
}
