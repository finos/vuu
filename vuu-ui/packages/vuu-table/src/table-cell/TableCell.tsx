import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  EditSession,
  useCellEdited,
  useEditSession,
} from "@vuu-ui/vuu-data-editing";
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
  searchPattern = "",
}: TableCellProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-table-cell",
    css: tableCellCss,
    window: targetWindow,
  });

  const editSession = useEditSession();
  // Only a staged EditSession supports inline insertion of new rows
  const stagedEditSession =
    editSession instanceof EditSession ? editSession : undefined;

  const { className, style } = useCell(column, classBase, false);
  const { ariaColIndex, CellRenderer, name, valueFormatter } = column;
  const isNewRow = stagedEditSession?.isNewRow(dataRow.key) ?? false;
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
      const isNewRow = stagedEditSession?.isNewRow(dataRow.key) ?? false;
      if (!isDataValueEditable(column, isNewRow ? "insert" : "update")) {
        return;
      }

      const { editType, isValid = true, previousValue = "", value } = editState;
      if (editPhase === "commit" && editSession) {
        if (editType === "cancel") {
          if (isNewRow) {
            // uncommitted values are never applied to the new row draft
            return { data: undefined, type: "SUCCESS_RESULT" };
          }
          return editSession.cancel(dataRow.key, name, value);
        }

        if (stagedEditSession && isNewRow) {
          const isEmptyValue = typeof value === "string" && value.trim() === "";
          if (!isValid && !isEmptyValue) {
            return { errorMessage: "Invalid value", type: "ERROR_RESULT" };
          }
          stagedEditSession.setNewRowValue(name, value);
          if (
            stagedEditSession.isNewRowFinalColumn(name) ||
            stagedEditSession.isNewRowComplete()
          ) {
            return stagedEditSession.addNewRow();
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
    [column, dataRow, editSession, name, stagedEditSession],
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
