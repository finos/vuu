import { RowClassGenerator } from "@vuu-ui/vuu-utils";
import { registerComponent } from "@vuu-ui/vuu-utils";

import "./filled-row.css";
import { DataRow } from "@vuu-ui/vuu-table-types";

export const filledRowFormatter: RowClassGenerator = {
  id: "filled-rows",
  fn: (dataRow: DataRow) => {
    if (
      dataRow.hasColumn("filledQuantity") &&
      dataRow.filledQuantity === dataRow.quantity
    ) {
      return "filled";
    } else if (
      dataRow.hasColumn("filledQty") &&
      dataRow.filledQty === dataRow.quantity
    ) {
      return "filled";
    }
  },
};

registerComponent("filled-rows", filledRowFormatter, "row-class-generator", {});
