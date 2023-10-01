import { TableCellProps } from "@finos/vuu-datagrid-types";
import { metadataKeys } from "@finos/vuu-utils";
import { VuuColumnDataType } from "packages/vuu-protocol-types";
import { useCallback } from "react";
import { useCell } from "../useCell";

import "./TableCell.css";

const { IDX } = metadataKeys;
const classBase = "vuuTableNextCell";

export const TableCell = ({
  column,
  columnMap,
  onDataEdited,
  row,
}: TableCellProps) => {
  const { className, style } = useCell(column, classBase);
  const { CellRenderer, name, valueFormatter } = column;
  const dataIdx = columnMap[name];

  const handleDataItemEdited = useCallback(
    (value: VuuColumnDataType) => {
      onDataEdited?.(row[IDX], name, value);
      return true;
    },
    [name, onDataEdited, row]
  );

  return (
    <div className={className} role="cell" style={style}>
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
