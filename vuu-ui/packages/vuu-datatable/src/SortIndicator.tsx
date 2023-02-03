import { ColumnSort } from "@finos/vuu-datagrid-types";
import cx from "classnames";

import "./SortIndicator.css";

export interface SortIndicatorProps {
  sorted?: ColumnSort;
}

const classBase = "vuuSortIndicator";

export const SortIndicator = ({ sorted }: SortIndicatorProps) => {
  if (!sorted) {
    return null;
  }

  const direction =
    typeof sorted === "number"
      ? sorted < 0
        ? "dsc"
        : "asc"
      : sorted === "A"
      ? "asc"
      : "dsc";

  return typeof sorted === "number" ? (
    <div className={cx(classBase, "multi-col", direction)}>
      <span data-icon={`sorted-${direction}`} />
      <span className={"vuuSortPosition"}>{Math.abs(sorted)}</span>
    </div>
  ) : (
    <div className={cx(classBase, "single-col")}>
      <span data-icon={`sorted-${direction}`} />
    </div>
  );
};
