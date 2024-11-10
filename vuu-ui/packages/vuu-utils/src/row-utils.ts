//TODO this all probably belongs in vuu-table
import type { DataSourceRow, DataSourceRowObject } from "@finos/vuu-data-types";
import type { MutableRefObject } from "react";
import { ColumnMap, metadataKeys } from "./column-utils";
import { isRowSelected } from "./selection-utils";

const { IS_LEAF, KEY, IDX } = metadataKeys;

export type RowOffsetFunc = (
  row: DataSourceRow,
  pctScrollTop?: number,
) => number;
export type RowAtPositionFunc = (position: number) => number;

/**
 * RowOffset function, RowAtPosition function, isVirtualScroll
 */
export type RowPositioning = [RowOffsetFunc, RowAtPositionFunc, boolean];

export const actualRowPositioning = (rowHeight: number): RowPositioning => [
  (row) => row[IDX] * rowHeight,
  (position) => Math.floor(position / rowHeight),
  false,
];

/**
 * return functions for determining a) the pixel offset to apply to a row, given the
 * row index and b) the index of the row at a given scroll offset. This implementation
 * is used when we are forced to 'virtualise' scrolling - because the number of rows
 * is high enough that we cannot create a large enough HTML content container.
 *
 * @param rowHeight
 * @param virtualisedExtent
 * @param pctScrollTop
 * @returns
 */
export const virtualRowPositioning = (
  rowHeight: number,
  virtualisedExtent: number,
  pctScrollTop: MutableRefObject<number>,
): RowPositioning => [
  (row, offset = 0) => {
    const rowOffset = pctScrollTop.current * virtualisedExtent;
    return (row[IDX] - offset) * rowHeight - rowOffset;
  },
  /*
    Return index position of closest row 
  */
  (position) => {
    const rowOffset = pctScrollTop.current * virtualisedExtent;
    return Math.round((position + rowOffset) / rowHeight);
  },
  true,
];

export type RowToObjectMapper = (
  row: DataSourceRow,
  columnMap: ColumnMap,
) => DataSourceRowObject;

export const asDataSourceRowObject: RowToObjectMapper = (
  row,
  columnMap,
): DataSourceRowObject => {
  const { [IS_LEAF]: isLeaf, [KEY]: key, [IDX]: index } = row;

  const rowObject: DataSourceRowObject = {
    key,
    index,
    isGroupRow: !isLeaf,
    isSelected: isRowSelected(row),
    data: {},
  };

  for (const [colName, colIdx] of Object.entries(columnMap)) {
    rowObject.data[colName] = row[colIdx];
  }

  return rowObject;
};
