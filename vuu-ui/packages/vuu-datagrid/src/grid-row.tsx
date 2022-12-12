import { HTMLAttributes, memo, useCallback } from "react";
import cx from "classnames";
import { ColumnMap, DataRow, metadataKeys } from "@vuu-ui/vuu-utils";
import { GridCell, GroupCell } from "./grid-cells";

import "./grid-row.css";
import {
  isGroupColumn,
  KeyedColumnDescriptor,
} from "./grid-model/gridModelTypes";

const classBase = "vuuDataGridRow";

const { KEY, SELECTED, IS_LEAF, IS_EXPANDED } = metadataKeys;

export interface RowProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
  columnMap: ColumnMap;
  columns: KeyedColumnDescriptor[];
  height: number;
  idx: number;
  onClick: (
    idx: number,
    row: DataRow,
    rangeSelect: boolean,
    keepExistingSelection: boolean
  ) => void;
  row: DataRow;
}

const Row = memo(function Row({
  columnMap,
  columns,
  height,
  idx,
  row,
  onClick,
}: RowProps) {
  const { [IS_LEAF]: isLeaf, [IS_EXPANDED]: expanded } = row;
  const isEmptyRow = row[KEY] === undefined;
  const isGroup = !isEmptyRow && !isLeaf;
  const isLastSelected = row[SELECTED] === 2;
  const isSelected = isLastSelected || row[SELECTED] === 1;

  const className = cx(classBase, {
    group: isGroup,
    collapsed: !isLeaf && !expanded,
    expanded,
    empty: isEmptyRow,
    [`${classBase}-even`]: idx % 2 === 0,
    [`${classBase}-lastSelected`]: isLastSelected,
  });

  const handleClick = useCallback(
    (e) => {
      const rangeSelect = e.shiftKey;
      const keepExistingSelection = e.ctrlKey || e.metaKey; /* mac only */
      onClick(idx, row, rangeSelect, keepExistingSelection);
    },
    [idx, onClick, row]
  );

  return (
    <div
      aria-selected={isSelected || undefined}
      data-idx={idx}
      className={className}
      onClick={handleClick}
      style={{
        transform: `translate3d(0px, ${idx * height}px, 0px)`,
      }}
    >
      {columns.map((column) =>
        isGroupColumn(column) ? (
          <GroupCell column={column} key={column.key} row={row} />
        ) : (
          <GridCell
            key={column.key}
            column={column}
            columnMap={columnMap}
            row={row}
          />
        )
      )}
    </div>
  );
});

export default Row;
