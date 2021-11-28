import {ColumnMeta, Row} from '../store/types'; 
import {Range} from './range-utils';

export type RowsIndexTuple = [Row[], number]

type GroupIteratorInstance = {
  direction: number; // how do we restrict to 0 or 1 without polluting the JS ?
  rangePositions: any;
  setRange: (range: Range, useDelta?: boolean) => RowsIndexTuple;
  currentRange: () => RowsIndexTuple;
  /**
   * Used to locate a group within the current range, to facilitate updates
   */
  getRangeIndexOfGroup: (grpIdx: number) => number;
  /**
   * Used to locate a row within the current range, to facilitate updates
   */
  getRangeIndexOfRow: (rowIdx: number) => number;
  setNavSet: Function;
  refresh: Function;
  clear: Function;
}

export type GroupIterator = (
  groups: Row[],
  navSet: number[],
  data: Row[],
  NAV_IDX: number,
  NAV_COUNT: number
) => GroupIteratorInstance;

declare const GroupIterator: GroupIterator;
export default GroupIterator;