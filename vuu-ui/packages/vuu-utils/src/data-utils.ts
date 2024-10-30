export type valueChangeDirection = "up1" | "up2" | "down1" | "down2" | "";

export const UP1 = "up1";
export const UP2 = "up2";
export const DOWN1 = "down1";
export const DOWN2 = "down2";

const decimalPattern = /^-?[0-9]*\.[0-9]+$/;

export const stringIsValidInt = (val: string) =>
  parseInt(val, 10).toString() === val;

export const stringIsValidDecimal = (val: string) =>
  stringIsValidInt(val) || decimalPattern.test(val);

export const stringIsValidNumber = (val: string) =>
  stringIsValidInt(val) || stringIsValidDecimal(val);

export const numericTypeOfStringValue = (val: string) =>
  stringIsValidInt(val) ? "int" : stringIsValidDecimal(val) ? "double" : "NaN";

export const isValidNumber = (n: unknown): n is number =>
  typeof n === "number" && isFinite(n);

const EMPTY = {};
export const shallowEquals = (
  o1: { [key: string]: unknown } = EMPTY,
  o2: { [key: string]: unknown } = EMPTY,
) => {
  const props1 = Object.keys(o1);
  const props2 = Object.keys(o2);
  return (
    props1.length === props2.length &&
    props1.every((key) => o1[key] === o2[key])
  );
};

export function getMovingValueDirection(
  newValue?: number,
  direction?: valueChangeDirection,
  prevValue?: number,
  /** the number of decimal places to take into account when highlighting a change  */
  decimalPlaces?: number,
): valueChangeDirection {
  if (newValue === undefined) {
    return "";
  }
  if (
    !isFinite(newValue) ||
    prevValue === undefined ||
    direction === undefined
  ) {
    return "";
  } else {
    let diff = newValue - prevValue;
    if (diff) {
      // make sure there is still a diff when reduced to number of decimals to be displayed
      if (typeof decimalPlaces === "number") {
        diff =
          +newValue.toFixed(decimalPlaces) - +prevValue.toFixed(decimalPlaces);
      }
    }

    if (diff) {
      if (direction === "") {
        if (diff < 0) {
          return DOWN1;
        } else {
          return UP1;
        }
      } else if (diff > 0) {
        if (direction === DOWN1 || direction === DOWN2 || direction === UP2) {
          return UP1;
        } else {
          return UP2;
        }
      } else if (
        direction === UP1 ||
        direction === UP2 ||
        direction === DOWN2
      ) {
        return DOWN1;
      } else {
        return DOWN2;
      }
    } else {
      return "";
    }
  }
}
