import { useEffect, useRef } from "react";
import { KeyedColumnDescriptor } from "../grid-model/gridModelTypes";
import { isTypeDescriptor } from "../grid-model";

const INITIAL_VALUE = [undefined, undefined, undefined, undefined];

type valueChangeDirection = "up1" | "up2" | "down1" | "down2" | "";

export const UP1 = "up1";
export const UP2 = "up2";
export const DOWN1 = "down1";
export const DOWN2 = "down2";

type State = [string, unknown, KeyedColumnDescriptor, valueChangeDirection];

const isValidNumber = (n: unknown): n is number =>
  typeof n === "number" && isFinite(n);

export default function useDirection(
  key: string,
  value: unknown,
  column: KeyedColumnDescriptor
) {
  const ref = useRef<State>();
  const [prevKey, prevValue, prevColumn, prevDirection] =
    ref.current || INITIAL_VALUE;
  const direction =
    key === prevKey &&
    isValidNumber(value) &&
    isValidNumber(prevValue) &&
    column === prevColumn
      ? getDirection(value, column, prevDirection, prevValue)
      : "";

  useEffect(() => {
    ref.current = [key, value, column, direction];
  });

  return direction;
}

function getDirection(
  newValue: number,
  column: KeyedColumnDescriptor,
  direction?: valueChangeDirection,
  prevValue?: number
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
      const { type: dataType } = column;
      const decimals =
        isTypeDescriptor(dataType) && dataType.formatting?.decimals;
      if (typeof decimals === "number") {
        diff = +newValue.toFixed(decimals) - +prevValue.toFixed(decimals);
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
