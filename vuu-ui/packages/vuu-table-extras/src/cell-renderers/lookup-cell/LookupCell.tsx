import { useLookupValues } from "@vuu-ui/vuu-data-react";
import { TableCellRendererProps } from "@vuu-ui/vuu-table-types";
import { dataAndColumnUnchanged, registerComponent } from "@vuu-ui/vuu-utils";
import { memo } from "react";

export const LookupCell = memo(function LookupCell({
  column,
  columnMap,
  row,
}: TableCellRendererProps) {
  const dataIdx = columnMap[column.name];
  const dataValue = row[dataIdx] as string | number;
  const { initialValue: value } = useLookupValues(column, dataValue);
  return <span>{value?.label}</span>;
}, dataAndColumnUnchanged);

registerComponent("lookup-cell", LookupCell, "cell-renderer", {
  userCanAssign: false,
});
