//TODO this all probably belongs in vuu-table
import type {
  DataSourceRow,
  DataSourceRowObject,
} from "@vuu-ui/vuu-data-types";
import { ColumnMap, metadataKeys } from "./column-utils";
import { IKeySet } from "./keyset";
import { VuuRow } from "@vuu-ui/vuu-protocol-types";
import { RefObject } from "react";
import { DataRow } from "@vuu-ui/vuu-table-types";

const { IS_LEAF, KEY, IDX, SELECTED } = metadataKeys;

export type RowOffsetFunc = (dataRow: DataRow, pctScrollTop?: number) => number;
export type RowAtPositionFunc = (position: number) => number;

/**
 * RowOffset function, RowAtPosition function, isVirtualScroll
 */
export type RowPositioning = [RowOffsetFunc, RowAtPositionFunc, boolean];

export const actualRowPositioning = (rowHeight: number): RowPositioning => [
  (dataRow) => dataRow.index * rowHeight,
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
  pctScrollTop: RefObject<number>,
): RowPositioning => [
  (dataRow, offset = 0) => {
    const rowOffset = pctScrollTop.current * virtualisedExtent;
    return (dataRow.index - offset) * rowHeight - rowOffset;
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

// deprecated
export type RowToObjectMapper = (
  row: DataSourceRow,
  columnMap: ColumnMap,
) => DataSourceRowObject;

// deprecated
export const asDataSourceRowObject: RowToObjectMapper = (
  row,
  columnMap,
): DataSourceRowObject => {
  const { [IS_LEAF]: isLeaf, [KEY]: key, [IDX]: index } = row;

  const rowObject: DataSourceRowObject = {
    key,
    index,
    isGroupRow: !isLeaf,
    isSelected: row[SELECTED] !== 0,
    data: {},
  };

  for (const [colName, colIdx] of Object.entries(columnMap)) {
    rowObject.data[colName] = row[colIdx];
  }

  return rowObject;
};

// deprecated
export const vuuRowToDataSourceRow = (
  { rowIndex, rowKey, sel: isSelected = 0, ts, data }: VuuRow,
  keys: IKeySet,
) => {
  return [
    rowIndex,
    keys.keyFor(rowIndex),
    true,
    false,
    0,
    0,
    rowKey,
    isSelected,
    ts,
    false, // IsNew
  ].concat(data) as DataSourceRow;
};
