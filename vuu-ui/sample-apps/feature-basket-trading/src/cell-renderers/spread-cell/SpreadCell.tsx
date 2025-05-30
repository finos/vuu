import { TableCellProps } from "@vuu-ui/vuu-table-types";
import { registerComponent } from "@vuu-ui/vuu-utils";
import { CSSProperties } from "react";

import "./SpreadCell.css";

const classBase = "vuuBasketSpreadCell";

export const SpreadCell = ({ columnMap, row }: TableCellProps) => {
  //TODO what about click handling

  const askValue = row[columnMap.ask] as number;
  const bidValue = row[columnMap.bid] as number;
  const limitPriceValue = row[columnMap.limitPrice] as number;

  const calculateSpreadOffset = () => {
    const spread = askValue - bidValue;
    const mid = bidValue + spread / 2;
    return limitPriceValue >= mid
      ? ((limitPriceValue - bidValue) / spread) * 16
      : ((limitPriceValue - bidValue) / spread) * -16;
  };

  const getSpreadOffset = () => {
    if (limitPriceValue < bidValue) {
      return -25;
    } else if (limitPriceValue === bidValue) {
      return -18;
    } else if (limitPriceValue === askValue) {
      return 18;
    } else if (limitPriceValue > askValue) {
      return 25;
    } else {
      return calculateSpreadOffset();
    }
  };

  const offset = getSpreadOffset();

  return (
    <div className={classBase} tabIndex={-1}>
      <div
        className={`${classBase}-track`}
        style={{ "--spread-offset": `${offset}px` } as CSSProperties}
      >
        <div className={`${classBase}-track-start`} />
        <div className={`${classBase}-pointer`} />
        <div className={`${classBase}-track-end`} />
      </div>
    </div>
  );
};

registerComponent("basket-spread", SpreadCell, "cell-renderer", {
  description: "Spread formatter",
  label: "Spread formatter",
  serverDataType: ["long", "int", "double"],
});
