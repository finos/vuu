import { DataSourceRow } from "@finos/vuu-data";
import { MutableRefObject } from "react";
import { metadataKeys } from "@finos/vuu-utils";

const { IDX } = metadataKeys;

export type RowOffsetFunc = (
  row: DataSourceRow,
  pctScrollTop?: number
) => number;
export type RowAtPositionFunc = (position: number) => number;

export type RowPositioning = [RowOffsetFunc, RowAtPositionFunc];

export const actualRowPositioning = (rowHeight: number): RowPositioning => [
  (row) => row[IDX] * rowHeight,
  (position) => Math.floor(position / rowHeight),
];

export const virtualRowPositioning = (
  rowHeight: number,
  additionalPixelsNeeded: number,
  pctScrollTop: MutableRefObject<number>
): RowPositioning => [
  (row) => {
    const rowOffset = pctScrollTop.current * additionalPixelsNeeded;
    return row[IDX] * rowHeight - rowOffset;
  },
  (position) => {
    const rowOffset = pctScrollTop.current * additionalPixelsNeeded;
    const result = Math.floor((position + rowOffset) / rowHeight);
    console.log(
      `get row at position ${position} = ${result} (scrollTop = ${pctScrollTop.current})`
    );
    return result;
  },
];
