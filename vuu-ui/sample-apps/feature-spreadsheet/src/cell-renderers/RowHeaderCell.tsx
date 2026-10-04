import type { TableCellRendererProps } from "@vuu-ui/vuu-table-types";
import { registerComponent } from "@vuu-ui/vuu-utils";

import "./RowHeaderCell.css";

const classBase = "vuuSpreadsheetRowHeaderCell";

/**
 * Renders the row number, styled like the Excel row header column.
 */
export const RowHeaderCell = ({ column, dataRow }: TableCellRendererProps) => (
  <span className={classBase}>{dataRow[column.name] as number}</span>
);

registerComponent("spreadsheet-row-header", RowHeaderCell, "cell-renderer", {
  userCanAssign: false,
});
