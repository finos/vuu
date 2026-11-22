import { LIMIT_METRICS, LIMIT_PERIODS } from "@vuu-ui/vuu-data-test";
import { DropdownCell } from "@vuu-ui/vuu-table-extras";
import type {
  ColumnDescriptor,
  TableCellRendererProps,
} from "@vuu-ui/vuu-table-types";
import { registerComponent } from "@vuu-ui/vuu-utils";
import { useMemo } from "react";

/** The periods allowed for a metric, all of them until a metric is chosen. */
const periodsFor = (metric: unknown) =>
  (LIMIT_METRICS[String(metric)]?.periods ?? LIMIT_PERIODS).slice();

/**
 * Edits the period of a limit with a dropdown of the periods its metric
 * allows. The options follow the metric chosen in the same row.
 */
export const PeriodCell = (props: TableCellRendererProps) => {
  const { column, dataRow } = props;
  const { metric } = dataRow;
  const periodColumn = useMemo(
    () =>
      ({
        ...column,
        type: {
          name: "string",
          renderer: { name: "dropdown-cell", values: periodsFor(metric) },
        },
      }) as typeof column & ColumnDescriptor,
    [column, metric],
  );
  // The dropdown reads its options when it mounts, so a new metric remounts it
  return <DropdownCell {...props} column={periodColumn} key={String(metric)} />;
};

registerComponent("period-cell", PeriodCell, "cell-renderer", {
  userCanAssign: false,
});
