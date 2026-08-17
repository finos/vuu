import { Button, Tooltip } from "@salt-ds/core";
import type {
  ColumnTypeRendering,
  DataValueTypeDescriptor,
  TableCellRendererProps,
} from "@vuu-ui/vuu-table-types";
import { Icon } from "@vuu-ui/vuu-ui-controls";
import { registerComponent } from "@vuu-ui/vuu-utils";
import { useCallback, useSyncExternalStore } from "react";
import { useEditSession } from "./DataEditingProvider";

export const UNDO_CELL_RENDERER = "vuu.undo-cell";

export interface UndoCellRendererComponentProps {
  icon?: string;
  text?: string | false;
}

export const getUndoButtonContent = (
  componentProps?: UndoCellRendererComponentProps,
) => ({
  icon: componentProps?.icon,
  text:
    componentProps?.text === undefined
      ? "UNDO"
      : componentProps.text || undefined,
});

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
  const hasRowChanges = useSyncExternalStore(
    useCallback(
      (onStoreChange) => {
        if (!editSession) {
          return () => undefined;
        }
        const handleRowChange = (key: string) => {
          if (key === dataRow.key) {
            onStoreChange();
          }
        };
        editSession.on("rowChangeChanged", handleRowChange);
        return () => editSession.removeListener("rowChangeChanged", handleRowChange);
      },
      [dataRow.key, editSession],
    ),
    useCallback(
      () => editSession?.hasRowChanges(dataRow.key) ?? false,
      [dataRow.key, editSession],
    ),
  );
  const renderer = (column.type as DataValueTypeDescriptor)
    ?.renderer as ColumnTypeRendering;
  const { icon, text } = getUndoButtonContent(
    renderer?.componentProps as UndoCellRendererComponentProps | undefined,
  );
  const tooltipContent = getUndoTooltipContent(
    dataRow.vuu_action,
    hasRowChanges,
  );

  if (tooltipContent === undefined) return null;

  return (
    <Tooltip content={tooltipContent}>
      <Button
        appearance="transparent"
        aria-label={tooltipContent}
        onClick={() => editSession?.undoRowChange(dataRow.key)}
        style={{ height: "100%", width: "100%" }}
      >
        {icon ? <Icon name={icon} /> : null}
        {text}
      </Button>
    </Tooltip>
  );
};

registerComponent(UNDO_CELL_RENDERER, UndoCellRenderer, "cell-renderer");
