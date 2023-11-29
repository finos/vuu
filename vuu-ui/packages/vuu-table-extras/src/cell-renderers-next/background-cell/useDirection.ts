import { RuntimeColumnDescriptor } from "@finos/vuu-datagrid-types";
import {
  getMovingValueDirection,
  isTypeDescriptor,
  isValidNumber,
  valueChangeDirection,
} from "@finos/vuu-utils";
import { useEffect, useRef } from "react";

const INITIAL_VALUE = [undefined, undefined, undefined, undefined];

type State = [string, unknown, RuntimeColumnDescriptor, valueChangeDirection];

export function useDirection(
  key: string,
  value: unknown,
  column: RuntimeColumnDescriptor
) {
  const ref = useRef<State>();
  const [prevKey, prevValue, prevColumn, prevDirection] =
    ref.current || INITIAL_VALUE;

  const { type: dataType } = column;
  const decimals = isTypeDescriptor(dataType)
    ? dataType.formatting?.decimals
    : undefined;

  const direction =
    key === prevKey &&
    isValidNumber(value) &&
    isValidNumber(prevValue) &&
    column === prevColumn
      ? getMovingValueDirection(value, prevDirection, prevValue, decimals)
      : "";

  useEffect(() => {
    ref.current = [key, value, column, direction];
  });

  return direction;
}
