import React, { HTMLAttributes, useContext } from "react";
import cx from "classnames";
import { useCellFormatter } from "./useCellFormatter";
import ComponentContext from "../component-context";

import "./GridCell.css";
import {
  isTypeDescriptor,
  KeyedColumnDescriptor,
} from "../grid-model/gridModelTypes";
import { ColumnMap, DataRow } from "@vuu-ui/vuu-utils";

const columnType = (column: KeyedColumnDescriptor) =>
  !column.type
    ? null
    : typeof column.type === "string"
    ? column.type
    : column.type.name;

// TODO we want to allow css class to be determined by value
function useGridCellClassName(column: KeyedColumnDescriptor) {
  // const count = getInstanceCount(classes);
  // console.log(`instance count = ${JSON.stringify(count)}`)

  return cx(
    "vuuDataGridCell",
    column.className,
    columnType(column),
    column.resizing ? "resizing" : null,
    column.moving ? "moving" : null
  );
}

const cellValuesAreEqual = (prev: GridCellProps, next: GridCellProps) => {
  return (
    prev.column === next.column &&
    prev.row[prev.column.key] === next.row[next.column.key]
  );
};

export interface GridCellProps extends HTMLAttributes<HTMLDivElement> {
  column: KeyedColumnDescriptor;
  columnMap: ColumnMap;
  row: DataRow;
}

// perhaps context would be more appropriate for columnMap
export const GridCell = React.memo(function GridCell({
  column,
  columnMap,
  row,
}: GridCellProps) {
  const components = useContext(ComponentContext);
  const [format] = useCellFormatter(column);
  const className = useGridCellClassName(column);
  const { type } = column;
  const rendererName = isTypeDescriptor(type) ? type?.renderer?.name : null;
  const Cell =
    rendererName &&
    (components?.[rendererName] as React.FunctionComponent<GridCellProps>);

  if (Cell) {
    return (
      <Cell
        className={className}
        column={column}
        columnMap={columnMap}
        row={row}
      />
    );
  } else {
    return (
      <div
        className={className}
        style={{ marginLeft: column.marginLeft, width: column.width }}
        tabIndex={-1}
      >
        {format(row[column.key])}
      </div>
    );
  }
},
cellValuesAreEqual);
