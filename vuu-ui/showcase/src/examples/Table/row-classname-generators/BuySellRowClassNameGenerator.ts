import { DataSourceRow } from "@vuu-ui/vuu-data-types";
import { ColumnMap, RowClassGenerator } from "@vuu-ui/vuu-utils";
import { registerComponent } from "@vuu-ui/vuu-utils";

import "./buy-sell.css";

export const buySellFormatter: RowClassGenerator = {
  id: "buy-sell-rows",
  fn: (row: DataSourceRow, columnMap: ColumnMap) => {
    const val = row[columnMap.side];
    if (typeof val === "string") {
      const uppercaseVal = val.toUpperCase();
      if (uppercaseVal === "BUY") {
        return "sideBuy";
      } else if (uppercaseVal === "SELL") {
        return "sideSell";
      }
    }
  },
};

registerComponent("buy-sell-rows", buySellFormatter, "row-class-generator", {});
