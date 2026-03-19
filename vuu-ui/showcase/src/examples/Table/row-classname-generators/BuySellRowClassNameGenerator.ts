import { RowClassGenerator } from "@vuu-ui/vuu-utils";
import { registerComponent } from "@vuu-ui/vuu-utils";

import "./buy-sell.css";
import { DataRow } from "@vuu-ui/vuu-table-types";

export const buySellFormatter: RowClassGenerator = {
  id: "buy-sell-rows",
  fn: (dataRow: DataRow) => {
    const val = dataRow.side;
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
