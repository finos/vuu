//TODO replace all use of any
export type lowestIdxPointerFunc = (groups: any, IDX: number, DEPTH: number, start: number, depth: number) => number | undefined;
export declare const lowestIdxPointer: lowestIdxPointerFunc;

export type getCountFunc = (groupRow: any[], PRIMARY_COUNT: number, FALLBACK_COUNT?: number) => number | undefined;
export declare const getCount: getCountFunc;

export type groupRowsFunc = (rows: any[][], sortSet: number[], columns: any[], columnMap: any, groupBy: any, options?: any) => any;
export declare const groupRows: groupRowsFunc;

export type findAggregatedColumns = (columns: any[], columnMap: any, groupBy: any) => any[];
export declare const findAggregatedColumns: findAggregatedColumns;

export type findDoomedColumnDepths = (groupBy: any[], existingGroupBy: any[]) => any[];
export declare const findDoomedColumnDepths: findDoomedColumnDepths; 

export type findSortedCol = (groupBy: any[], existingGroupBy: any[]) => any[];
export declare const findSortedCol: findSortedCol; 

export type getGroupStateChanges = (groupState: any, existingGroupState: any) => any[];
export declare const getGroupStateChanges: getGroupStateChanges; 

export type updateGroupBy = (existingGroupBy: any, column: any) => any;
export declare const updateGroupBy: updateGroupBy; 

export type expanded = (group: any, groupBy: any, groupState: any) => boolean;
export declare const expanded: expanded; 

export type expandRow = (groupCols: any, row: any, meta: any) => any;
export declare const expandRow: expandRow; 

export type splitGroupsAroundDoomedGroup = (groupBy: any,doomed: any) => any;
export declare const splitGroupsAroundDoomedGroup: splitGroupsAroundDoomedGroup; 

export type groupbyExtendsExistingGroupby = (groupBy: any, existingGroupBy: any) => any;
export declare const groupbyExtendsExistingGroupby: groupbyExtendsExistingGroupby; 

export type groupbyReducesExistingGroupby = (groupBy: any, existingGroupBy: any) => any;
export declare const groupbyReducesExistingGroupby: groupbyReducesExistingGroupby; 

export type findGroupPositions = (groups: any, groupBy: any, row: any) => any[];
export declare const findGroupPositions: findGroupPositions; 

export type groupbySortReversed = (groupBy: any, existingGroupBy: any) => boolean;
export declare const groupbySortReversed: groupbySortReversed;

export declare const leafRow: any;
export declare class GroupIdxTracker {
  constructor(levels: number);
  hasPrevious(level: number): boolean;
  idxAdjustment: number;
  increment(count: number): void;
  previous(level: number): number;
  set(depth: number, groupKey: string): void;
  // TODO the rest
}

export declare class SimpleTracker {
  constructor(levels: number);
  set(depth: number, pos: number, groupKey: string): void;
  hasParentPos(level: number): boolean;
  hasPreviousPos(level: number): boolean;
  parentPos(level: number): number;
}

export type aggregateGroup = (
  groups: any, 
  grpIdx: number, 
  sortSet: number[], 
  rows: any[], 
  columns: any[],
  aggregations: any) => void;
export declare const aggregateGroup: aggregateGroup;

export type adjustGroupIndices = (
  groups: any,
  grpIdx: number,
  adjustment?: number
  ) => void;
export declare const adjustGroupIndices: adjustGroupIndices;

export type adjustLeafIdxPointers = (
  groups: any,
  insertionPoint: number,
  adjustment?: number
  ) => void;
export declare const adjustLeafIdxPointers: adjustLeafIdxPointers;

export type allGroupsExpanded = (
  groups: any,
  group: any,
) => boolean;
export declare const allGroupsExpanded: allGroupsExpanded;
