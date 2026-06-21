import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import type {
  TableCellEditHandler,
  TableCellProps,
} from "@vuu-ui/vuu-table-types";
import { useEditSession } from "@vuu-ui/vuu-utils";
import { MouseEventHandler, useCallback, useState } from "react";
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

  const { className, style } = useCell(column, classBase, false);
  const { ariaColIndex, CellRenderer, name, valueFormatter } = column;
  const [editedDuringCurrentSession, setEditingDuringCurrentSession] = useState<
    boolean | undefined
  >(undefined);

  const handleDataItemEdited = useCallback<TableCellEditHandler>(
    async (editState, editPhase) => {
      const { isValid = true, previousValue = "", value } = editState;
      if (editPhase === "commit" && editSession) {
        const { editedDuringCurrentSession, ...response } =
          await editSession.commit(
            dataRow.key,
            name,
            previousValue,
            value,
            isValid,
          );
        setEditingDuringCurrentSession(editedDuringCurrentSession);
        return response;
      }
    },
    [dataRow.key, editSession, name],
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
      onClick={onClick ? handleClick : undefined}
      role="cell"
      style={style}
    >
      {CellRenderer ? (
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
