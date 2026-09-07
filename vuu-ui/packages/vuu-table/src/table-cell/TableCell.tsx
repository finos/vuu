import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { useCellEdited, useEditSession } from "@vuu-ui/vuu-data-editing";
import type {
  TableCellEditHandler,
  TableCellProps,
} from "@vuu-ui/vuu-table-types";
import { isDataValueEditable } from "@vuu-ui/vuu-utils";
import { type MouseEventHandler, useCallback } from "react";
import { applyHighlighting } from "../applyHighlighting";
import { useCell } from "../useCell";

import tableCellCss from "./TableCell.css";

const classBase = "vuuTableCell";

export const TableCell = ({
  column,
  dataRow,
  onClick,
  onDataEdited,
  searchPattern = "",
}: TableCellProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-table-cell",
    css: tableCellCss,
    window: targetWindow,
  });

  const editSession = useEditSession();

  const { className, style } = useCell(column, classBase, false);
  const { ariaColIndex, CellRenderer, name, valueFormatter } = column;
  const isNewRow = editSession?.isNewRow(dataRow.key) ?? false;
  const isInsertOnly =
    isDataValueEditable(column, "insert") &&
    !isDataValueEditable(column, "update");
  const editedDuringCurrentSession = useCellEdited(
    editSession,
    dataRow.key,
    name,
  );

  const handleDataItemEdited = useCallback<TableCellEditHandler>(
    async (editState, editPhase) => {
      const editOperation = editSession?.isNewRow(dataRow.key)
        ? "insert"
        : "update";
      if (!isDataValueEditable(column, editOperation)) {
        return;
      }

      if (onDataEdited) {
        return onDataEdited(
          {
            ...editState,
            columnName: name,
            dataRow,
          },
          editPhase,
        );
      }

      const { isValid = true, previousValue = "", value } = editState;
      if (editPhase === "commit" && editSession) {
        if (editSession.isNewRow(dataRow.key)) {
          const isEmptyValue = typeof value === "string" && value.trim() === "";
          if (!isValid && !isEmptyValue) {
            return { errorMessage: "Invalid value", type: "ERROR_RESULT" };
          }
          editSession.setNewRowValue(name, value);
          if (
            editSession.isNewRowFinalColumn(name) ||
            editSession.isNewRowComplete()
          ) {
            return editSession.addNewRow();
          }
          return { data: undefined, type: "SUCCESS_RESULT" };
        }

        return editSession.commit(
          dataRow.key,
          name,
          previousValue,
          value,
          isValid,
        );
      }
    },
    [column, dataRow, editSession, name, onDataEdited],
  );

  const handleClick = useCallback<MouseEventHandler>(
    (evt) => {
      onClick?.(evt, column);
    },
    [column, onClick],
  );

  return (
    <div
      aria-colindex={ariaColIndex}
      className={className}
      data-field={name}
      onClick={onClick ? handleClick : undefined}
      role="cell"
      style={style}
    >
      {CellRenderer && (!isInsertOnly || isNewRow) ? (
        <CellRenderer
          column={column}
          dataRow={dataRow}
          editedDuringCurrentSession={editedDuringCurrentSession}
          onEdit={handleDataItemEdited}
          searchPattern={searchPattern}
        />
      ) : (
        applyHighlighting(valueFormatter(dataRow[column.name]), searchPattern)
      )}
    </div>
  );
};
