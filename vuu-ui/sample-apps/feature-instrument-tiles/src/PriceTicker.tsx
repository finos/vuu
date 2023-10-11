import {
  getMovingValueDirection,
  isValidNumber,
  numericFormatter,
  valueChangeDirection,
} from "@finos/vuu-utils";
import { memo, useRef } from "react";
import cx from "classnames";

const classBase = "vuuPriceTicker";

import "./PriceTicker.css";

const formatNumber = numericFormatter({
  type: {
    name: "number",
    formatting: {
      decimals: 2,
      zeroPad: true,
    },
  },
});

type State = [number | undefined, valueChangeDirection | undefined];
const INITIAL_VALUE: State = [undefined, undefined];

export interface PriceTickerProps {
  price: number;
}

export const PriceTicker = memo(({ price }: PriceTickerProps) => {
  const ref = useRef<State>(INITIAL_VALUE);
  const [prevValue, prevDirection] = ref.current;

  const direction = isValidNumber(prevValue)
    ? getMovingValueDirection(price, prevDirection, prevValue, 2)
    : "";

  ref.current = [price, direction];

  return <div className={cx(classBase, direction)}>{formatNumber(price)}</div>;
});
PriceTicker.displayName = "PriceTicker";
