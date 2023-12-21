import { useLookupValues } from "@finos/vuu-data-react";
import { TableCellRendererProps } from "@finos/vuu-table-types";
import { registerComponent } from "@finos/vuu-utils";
import { memo } from "react";
import { dataAndColumnUnchanged } from "@finos/vuu-table/src/cell-renderers/cell-utils";

// const classBase = "vuuTableLookupCell";

export const LookupCell = memo(function LookupCell({
  column,
  columnMap,
  row,
}: TableCellRendererProps) {
  const dataIdx = columnMap[column.name];
  const { initialValue: value } = useLookupValues(column, row[dataIdx]);
  return <span>{value?.label}</span>;
},
dataAndColumnUnchanged);

registerComponent("lookup-cell", LookupCell, "cell-renderer", {});
