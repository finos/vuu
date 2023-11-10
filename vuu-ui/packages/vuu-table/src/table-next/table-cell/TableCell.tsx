import {
  DataItemCommitHandler,
  TableCellProps,
} from "@finos/vuu-datagrid-types";
import {
  VuuColumnDataType,
  VuuRowDataItemType,
} from "@finos/vuu-protocol-types";
import { isNumericColumn } from "@finos/vuu-utils";
import { MouseEventHandler, useCallback } from "react";
import { useCell } from "../useCell";

import "./TableCell.css";

const classBase = "vuuTableNextCell";

export const TableCell = ({
  column,
  columnMap,
  onClick,
  onDataEdited,
  row,
}: TableCellProps) => {
  const { className, style } = useCell(column, classBase);
  const { CellRenderer, name, valueFormatter } = column;
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
