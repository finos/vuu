import { TableCellProps } from "@finos/vuu-datagrid-types";
import { metadataKeys } from "@finos/vuu-utils";
import { VuuColumnDataType } from "@finos/vuu-protocol-types";
import { MouseEventHandler, useCallback } from "react";
import { useCell } from "../useCell";

import "./TableCell.css";

const { IDX } = metadataKeys;
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

  const handleDataItemEdited = useCallback(
    (value: VuuColumnDataType) => {
      onDataEdited?.(row[IDX], name, value);
      // TODO will only return false in case of server rejection
      return true;
    },
    [name, onDataEdited, row]
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
