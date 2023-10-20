import {
  getMovingValueDirection,
  isValidNumber,
  numericFormatter,
  valueChangeDirection,
} from "@finos/vuu-utils";
import { HTMLAttributes, memo, useMemo, useRef } from "react";
import cx from "classnames";

const classBase = "vuuPriceTicker";

import "./PriceTicker.css";

const getValueFormatter = (decimals: number) =>
  numericFormatter({
    type: {
      name: "number",
      formatting: {
        decimals,
        zeroPad: true,
      },
    },
  });

type State = [number | undefined, valueChangeDirection | undefined];
const INITIAL_VALUE: State = [undefined, undefined];

export interface PriceTickerProps extends HTMLAttributes<HTMLDivElement> {
  decimals?: number;
  price?: number;
  showArrow?: boolean;
}

export const PriceTicker = memo(
  ({
    className,
    decimals = 2,
    price,
    showArrow,
    ...htmlAttributes
  }: PriceTickerProps) => {
    const ref = useRef<State>(INITIAL_VALUE);
    const [prevValue, prevDirection] = ref.current;
    const formatNumber = useMemo(() => getValueFormatter(decimals), [decimals]);

    const direction = isValidNumber(prevValue)
      ? getMovingValueDirection(price, prevDirection, prevValue, decimals)
      : "";

    ref.current = [price, direction];

    return (
      <div {...htmlAttributes} className={cx(classBase, className, direction)}>
        {formatNumber(price)}
        {showArrow ? <span data-icon="price-arrow" /> : null}
      </div>
    );
  }
);
PriceTicker.displayName = "PriceTicker";
