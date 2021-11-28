interface Column {
  flex?: number;
  key?: number;
  heading?: string[];
  initialFlex?: number;
  label?:string;
  locked?: boolean;
  // would like to avoid this, it is purely an internal implementation detail
  marginLeft?: number;
  minWidth?: number;
  name: string;
  resizeable?: boolean;
  resizing?: boolean;
  type?: any;
  width: number;
  // Group types, break these out
  isGroup?: true;
  columns?: Column[];
}

interface Heading {
  key: string;
  isHeading: true;
  label: string;
  width: number;
}

interface ColumnGroup {
  columns: Column[];
  contentWidth: number;
  headings?: Heading[];
  locked: boolean;
  left?: number;
  width: number;
};

type ColumnSizing = 'fill' | 'auto' | 'static'; 

type SortColumns = {
  [key: string] : any;
  // we can't use this in JavaScript. There are places where TS inference is not smart enough to 
  // work out which variant is valid. In TS we could use type assertions, we have no such option
  // in JS.
  // [key: string] : SortDirection | number;
}

type GroupState = {
  rowIdx?: number,
  [key: string]: boolean | GroupState;
}


type GridModel = {
  columnNames: string[];
  columnSizing: ColumnSizing;
  columnGroups: ColumnGroup[];
  customFooterHeight: number;
  customHeaderHeight: number;
  customInlineHeaderHeight: number;
  defaultColumnWidth?: number;
  groupColumns: SortColumns;// rename - too confusing with columnGroups
  groupState: GroupState;
  headerHeight: number;
  headingDepth: number;
  height: number;
  horizontalScrollbarHeight: number;
  minColumnWidth?: number;
  noColumnHeaders?: boolean;
  pivotColumns: SortColumns;
  renderBufferSize: number;
  rowHeight: number;
  sortColumns: SortColumns;
  viewportHeight: number;
  viewportRowCount: number;
  width: number;
};

type DragPhase = 'drag-start' | 'drag' | 'drag-pause' | 'drag-end'
type ResizePhase = 'begin' | 'resize' | 'end';

type GridModelResizeAction = { type: 'resize', height: number, width: number};
type GridModelResizeColAction = { type: 'resize-col', phase: ResizePhase, column: Column, width?: number};
type GridModelResizeHeadingAction = { type: 'resize-heading', phase: ResizePhase, column: Column, width?: number};
type GridModelAddColumnAction = { type: 'add-col', targetColumnGroup?: ColumnGroup, column: Column, insertIdx: number};
type GridModelInitializeAction = { type: 'initialize', props};
type GridModelGroupAction = { type: 'group', column: Column, direction?: SortDirection, add?: boolean, remove?: true};
type GridModelGroupAction = { type: 'pivot', column: Column, direction?: SortDirection, add?: boolean, remove?: true};
type GridModelSortAction = { type: 'sort', column: Column, direction?: SortDirection, add?: True, remove?: True};
type GridModelToggleAction = { type: 'toggle', row: any[]};
type GridModelSetColumnsAction = { type: 'set-available-columns', columns: Column[]};
type GridModelHideColumnAction = { type: 'column-hide', column: Column};
type GridModelShowColumnAction = { type: 'column-show', column: Column};
type GridModelPivotColumnsAction = { type: 'set-pivot-columns', columns: string[]};
type GridModelRowHeightAction = { type: 'ROW_HEIGHT', rowHeight: number};

type GridModelAction =
  | GridModelResizeAction
  | GridModelResizeColAction
  | GridModelResizeHeadingAction
  | GridModelAddColumnAction
  | GridModelInitializeAction
  | GridModelSortAction
  | GridModelGroupAction
  // | GridModelPivotAction
  | GridModelToggleAction
  | GridModelSetColumnsAction
  | GridModelShowColumnAction
  | GridModelHideColumnAction
  | GridModelPivotColumnsAction
  | GridModelRowHeightAction;

type GridModelDispatcher = (a: GridModelAction) => void

type GridModelReducer<A extends GridModelAction=GridModelAction> = (s: GridModel, a: A) => GridModel; 

type GridModelReducerFn<A=GridModelAction> = (state: GridModel, action: A) => GridModel;  
type GridModelReducerInitializer = (props: GridProps) => GridModel;
type GridModelReducer<T extends GridModelAction['type']> = 
  T extends 'resize' ? GridModelReducerFn<GridModelResizeAction> :
  T extends 'resize-col' ? GridModelReducerFn<GridModelResizeColAction> :
  T extends 'resize-heading' ? GridModelReducerFn<GridModelResizeHeadingAction> :
  T extends 'add-col' ? GridModelReducerFn<GridModelAddColumnAction> :
  T extends 'initialize' ? GridModelReducerFn<GridModelInitializeAction> :
  T extends 'sort' ? GridModelReducerFn<GridModelSortAction> :
  T extends 'group' ? GridModelReducerFn<GridModelGroupAction> :
  T extends 'pivot' ? GridModelReducerFn<GridModelPivotAction> :
  T extends 'toggle' ? GridModelReducerFn<GridModelToggleAction> :
  T extends 'set-columns' ? GridModelReducerFn<GridModelSetColumnsAction> :
  T extends 'column-show' ? GridModelReducerFn<GridModelShowColumnAction> :
  T extends 'column-hide' ? GridModelReducerFn<GridModelHideColumnAction> :
  T extends 'set-pivot-column' ? GridModelReducerFn<GridModelPivotColumnsAction> :
  T extends 'ROW_HEIGHT' ? GridModelReducerFn<GridModelRowHeightAction> :
  GridModelReducerFn<GridModelAction>;

  // couldn't figure out how the generically type the GridModelReducer
type GridModelReducerTable = {[key in GridModelAction['type']]: GridModelReducer<any>};  
