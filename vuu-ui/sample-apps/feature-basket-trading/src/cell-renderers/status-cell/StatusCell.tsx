import { TableCellRendererProps } from "@finos/vuu-datagrid-types";
import { registerComponent } from "@finos/vuu-utils";
import cx from "classnames";

import "./StatusCell.css";

const classBase = "vuuBasketTradingStatusCell";

const statusValues: { [key: string]: string } = {
  "on market": "live",
  "fully filled": "filled",
  rejected: "rejected",
  cancelled: "cancelled",
  PENDING: "pending",
};

export const StatusCell = ({
  column,
  columnMap,
  row,
}: TableCellRendererProps) => {
  const dataIdx = columnMap[column.name];
  const status = row[dataIdx];
  const statusClass = statusValues[status] ?? "unknown";

  return (
    <span className={cx(classBase, `${classBase}-${statusClass}`)}>
      {statusClass === "rejected" ? <span data-icon="error" /> : null}
      {status}
    </span>
  );
};

registerComponent("basket-status", StatusCell, "cell-renderer", {});
