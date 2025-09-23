import { DataSourceRow } from "@vuu-ui/vuu-data-types";
import { ColumnMap, RowClassGenerator } from "@vuu-ui/vuu-utils";
import { registerComponent } from "@vuu-ui/vuu-utils";

import "./filled-row.css";

export const filledRowFormatter: RowClassGenerator = {
  id: "filled-rows",
  fn: (row: DataSourceRow, columnMap: ColumnMap) => {
    if (row[columnMap.filledQuantity] === row[columnMap.quantity]) {
      return "filled";
    }
  },
};

registerComponent("filled-rows", filledRowFormatter, "row-class-generator", {});
