import { RuntimeColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { ColumnHeaderPill } from "./ColumnHeaderPill";

import sortIndicatorCss from "./SortIndicator.css";

export interface SortIndicatorProps {
  column: RuntimeColumnDescriptor;
}

export const SortIndicator = ({ column }: SortIndicatorProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-table-sort-indicator",
    css: sortIndicatorCss,
    window: targetWindow,
  });

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
    <ColumnHeaderPill className="vuuSortIndicator" column={column}>
      <span data-icon={icon} />
      {typeof column.sorted === "number" ? (
        <span className={"vuuSortPosition"}>{Math.abs(column.sorted)}</span>
      ) : null}
    </ColumnHeaderPill>
  );
};
