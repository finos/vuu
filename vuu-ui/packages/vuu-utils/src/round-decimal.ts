const PUNCTUATION_STR = String.fromCharCode(8200);
const DIGIT_STR = String.fromCharCode(8199);
const DECIMALS_AUTO = -1;

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
) {
  if (value === undefined || typeof value !== "number" || isNaN(value)) {
    return "";
  }
  let integral, fraction, Pad;

  const [part1, part2 = ""] = value.toString().split(".");
  const actualDecimals = part2.length;

  integral =
    part1 === "-0"
      ? "-0"
      : useLocaleString
        ? parseFloat(part1).toLocaleString()
        : parseFloat(part1).toString();

  if (align === Align.Left && alignOnDecimals) {
    integral = padLeft(integral);
  }

  if (decimals === DECIMALS_AUTO || actualDecimals === decimals) {
    fraction = part2;
  } else if (actualDecimals > decimals) {
    fraction = parseFloat("0." + part2)
      .toFixed(decimals)
      .slice(2);
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
        fraction = Pad.FULL_PADDING[decimals];
      } else {
        fraction = pad(part2, decimals, Pad);
      }
    } else {
      fraction = part2;
    }
  }

  return integral + (fraction ? "." + fraction : "");
}
