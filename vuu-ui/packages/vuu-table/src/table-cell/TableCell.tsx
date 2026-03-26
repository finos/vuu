import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import type {
  TableCellEditHandler,
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

  const [hasError, setHasError] = useState(false);

  const { className, style } = useCell(column, classBase, false, hasError);
  const { ariaColIndex, CellRenderer, valueFormatter } = column;
  // const dataIdx = columnMap[column.name];

  const handleDataItemEdited = useCallback<TableCellEditHandler>(
    (editState, editPhase) => {
      if (editPhase === "commit") {
        const { serverDataType = "string" } = column;
        const typedValue = getTypedValue(
          String(editState.value),
          serverDataType,
          true,
        );
        return onDataEdited?.(
          {
            ...editState,
            dataRow,
            columnName: column.name,
            value: typedValue,
          },
          editPhase,
        );
      } else {
        setHasError(editState.isValid === false);
        onDataEdited?.(
          {
            ...editState,
            dataRow,
            columnName: column.name,
          },
          editPhase,
        );
        return undefined;
      }
    },
    [column, dataRow, onDataEdited],
  );

  const handleClick = useCallback<MouseEventHandler>(
    (evt) => {
      onClick?.(evt, column);
    },
    [column, onClick],
  );

  const value = valueFormatter(dataRow[column.name]);
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
          dataRow={dataRow}
          onEdit={handleDataItemEdited}
          searchPattern={searchPattern}
        />
      ) : (
        valueWithHighlighting
      )}
    </div>
  );
};
