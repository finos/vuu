import { RuntimeColumnDescriptor } from "@finos/vuu-datagrid-types";
import { ColumnHeaderPill } from "./ColumnHeaderPill";

import "./SortIndicator.css";

export interface SortIndicatorProps {
  column: RuntimeColumnDescriptor;
}

export const SortIndicator = ({ column }: SortIndicatorProps) => {
  if (!column.sorted) {
    return null;
  }

  const icon =
    typeof column.sorted === "number"
      ? column.sorted < 0
        ? "arrow-down"
        : "arrow-up"
      : column.sorted === "A"
      ? "arrow-up"
      : "arrow-down";

  return (
    <ColumnHeaderPill column={column}>
      <span data-icon={icon} />
      {typeof column.sorted === "number" ? (
        <span className={"vuuSortPosition"}>{Math.abs(column.sorted)}</span>
      ) : null}
    </ColumnHeaderPill>
  );
};
