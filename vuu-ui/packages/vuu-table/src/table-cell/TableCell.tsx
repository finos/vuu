import { DataItemCommitHandler, TableCellProps } from "@finos/vuu-table-types";
import { isNumericColumn } from "@finos/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { MouseEventHandler, useCallback } from "react";
import { useCell } from "../useCell";

import tableCellCss from "./TableCell.css";

const classBase = "vuuTableCell";

export const TableCell = ({
  column,
  columnMap,
  onClick,
  onDataEdited,
  row,
}: TableCellProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-table-cell",
    css: tableCellCss,
    window: targetWindow,
  });

  const { className, style } = useCell(column, classBase);
  const { CellRenderer, index, name, valueFormatter } = column;
  const dataIdx = columnMap[name];

  const handleDataItemEdited = useCallback<DataItemCommitHandler>(
    (value) => {
      if (onDataEdited) {
        let typedValue = value;
        if (isNumericColumn(column) && typeof value === "string") {
          typedValue =
            column.serverDataType === "double"
              ? parseFloat(value)
              : parseInt(value);
        }
        return onDataEdited?.(row, name, typedValue);
      } else {
        throw Error(
          "TableCell onDataEdited prop not supplied for an editable cell"
        );
      }
    },
    [column, name, onDataEdited, row]
  );

  const handleClick = useCallback<MouseEventHandler>(
    (evt) => {
      onClick?.(evt, column);
    },
    [column, onClick]
  );

  return (
    <div
      aria-colindex={index}
      className={className}
      onClick={onClick ? handleClick : undefined}
      role="cell"
      style={style}
    >
      {CellRenderer ? (
        <CellRenderer
          column={column}
          columnMap={columnMap}
          onCommit={handleDataItemEdited}
          row={row}
        />
      ) : (
        valueFormatter(row[dataIdx])
      )}
    </div>
  );
};
