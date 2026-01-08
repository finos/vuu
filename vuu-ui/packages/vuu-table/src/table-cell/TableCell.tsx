import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import type {
  DataItemEditHandler,
  TableCellProps,
} from "@vuu-ui/vuu-table-types";
import { getTypedValue } from "@vuu-ui/vuu-utils";
import { MouseEventHandler, useCallback, useState } from "react";
import { useCell } from "../useCell";
import { useHighlighting } from "../useHighlighting";

import tableCellCss from "./TableCell.css";

const classBase = "vuuTableCell";

export const TableCell = ({
  column,
  columnMap,
  onClick,
  onDataEdited,
  row,
  searchPattern = "",
}: TableCellProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-table-cell",
    css: tableCellCss,
    window: targetWindow,
  });

  const [hasError, setHasError] = useState(false);

  const { className, style } = useCell(column, classBase, false, hasError);
  const { ariaColIndex, CellRenderer, valueFormatter } = column;
  const dataIdx = columnMap[column.name];

  const handleDataItemEdited = useCallback<DataItemEditHandler>(
    (editState, editPhase) => {
      if (editPhase === "commit") {
        const { serverDataType = "string" } = column;
        if (onDataEdited) {
          const typedValue = getTypedValue(
            String(editState.value),
            serverDataType,
            true,
          );
          return onDataEdited({
            ...editState,
            row,
            columnName: column.name,
            value: typedValue,
          });
        } else {
          throw Error(
            "TableCell onDataEdited prop not supplied for an editable cell",
          );
        }
      } else {
        setHasError(editState.isValid === false);
        onDataEdited({
          ...editState,
          row,
          columnName: column.name,
        });
        return undefined;
      }
    },
    [column, onDataEdited, row],
  );

  const handleClick = useCallback<MouseEventHandler>(
    (evt) => {
      onClick?.(evt, column);
    },
    [column, onClick],
  );

  const value = valueFormatter(row[dataIdx]);
  const valueWithHighlighting = useHighlighting(value, searchPattern);

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
          columnMap={columnMap}
          onEdit={handleDataItemEdited}
          row={row}
          searchPattern={searchPattern}
        />
      ) : (
        valueWithHighlighting
      )}
    </div>
  );
};
