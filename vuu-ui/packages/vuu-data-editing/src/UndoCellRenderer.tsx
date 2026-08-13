import { Button, Tooltip } from "@salt-ds/core";
import type {
  ColumnTypeRendering,
  DataValueTypeDescriptor,
  TableCellRendererProps,
} from "@vuu-ui/vuu-table-types";
import { registerComponent } from "@vuu-ui/vuu-utils";
import { useEditSession } from "./DataEditingProvider";

export const UNDO_CELL_RENDERER = "vuu.undo-cell";

export const getUndoTooltipContent = (
  action: unknown,
  hasRowChanges = false,
) =>
  action === "deleteRow"
    ? "Undo delete row"
    : action === "addRow"
      ? "Undo insert row"
      : action === "editCell" || hasRowChanges
        ? "Undo row edits"
        : undefined;

export const UndoCellRenderer = ({
  column,
  dataRow,
}: TableCellRendererProps) => {
  const editSession = useEditSession();
  const renderer = (column.type as DataValueTypeDescriptor)
    ?.renderer as ColumnTypeRendering;
  const sessionTableMessageColumn =
    (renderer?.componentProps?.sessionTableMessageColumn as string) ?? "vuuMsg";
  const tooltipContent = getUndoTooltipContent(
    dataRow.vuu_action,
    editSession?.hasRowChanges(dataRow.key),
  );
  const isRowChanged =
    tooltipContent !== undefined ||
    dataRow[sessionTableMessageColumn] === "SOFT_DELETED";

  if (!isRowChanged) return null;

  return (
    <Tooltip content={tooltipContent ?? "Undo delete row"}>
      <Button
        appearance="transparent"
        onClick={() => editSession?.undoRowChange(dataRow.key)}
        style={{ height: "100%", width: "100%" }}
      >
        Undo
      </Button>
    </Tooltip>
  );
};

registerComponent(UNDO_CELL_RENDERER, UndoCellRenderer, "cell-renderer");
