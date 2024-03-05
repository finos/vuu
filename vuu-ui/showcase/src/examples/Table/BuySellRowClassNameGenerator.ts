import { DataSourceRow } from "packages/vuu-data-types";
import { ColumnMap, RowClassGenerator } from "packages/vuu-utils/src";
import { registerComponent } from "@finos/vuu-utils";

import "./buy-sell.css";

export const buySellFormatter: RowClassGenerator = {
  id: "buy-sell-rows",
  fn: (row: DataSourceRow, columnMap: ColumnMap) => {
    if (row[columnMap.side] === "BUY") {
      return "sideBuy";
    } else if (row[columnMap.side] === "SELL") {
      return "sideSell";
    }
  },
};

registerComponent("buy-sell-rows", buySellFormatter, "row-class-generator", {});
