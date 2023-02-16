export type valueChangeDirection = "up1" | "up2" | "down1" | "down2" | "";

export const UP1 = "up1";
export const UP2 = "up2";
export const DOWN1 = "down1";
export const DOWN2 = "down2";

export const isValidNumber = (n: unknown): n is number =>
  typeof n === "number" && isFinite(n);

export function getMovingValueDirection(
  newValue: number,
  direction?: valueChangeDirection,
  prevValue?: number,
  /** the number of decimal places to take into account when highlighting a change  */
  decimalPlaces?: number
): valueChangeDirection {
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
