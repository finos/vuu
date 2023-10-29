import type { ValueFormatter } from "@finos/vuu-table";
import type { Filter } from "@finos/vuu-filter-types";
import type {
  VuuAggType,
  VuuColumnDataType,
  VuuSortType,
} from "@finos/vuu-protocol-types";
import type { FunctionComponent, MouseEvent } from "react";
import type { ClientSideValidationChecker } from "@finos/vuu-ui-controls";
import type { ColumnMap } from "@finos/vuu-utils";

export type TableSelectionModel = "none" | "single" | "checkbox" | "extended";

export type RangeTuple = [from: number, to: number];
export type SelectionItem = number | RangeTuple;
export type Selection = SelectionItem[];
export type SelectionChangeHandler = (selection: Selection) => void;

export type TableHeading = { label: string; width: number };
export type TableHeadings = TableHeading[][];

export type DataCellEditHandler = (
  row: DataSourceRow,
  columnName: string,
  value: VuuColumnDataType
) => boolean;

export interface TableCellProps {
  className?: string;
  column: KeyedColumnDescriptor;
  columnMap: ColumnMap;
  onClick?: (event: MouseEvent, column: KeyedColumnDescriptor) => void;
  onDataEdited?: DataCellEditHandler;
  row: DataSourceRow;
}

export interface TableCellRendererProps
  extends Omit<TableCellProps, "onDataEdited"> {
  onCommit?: (value: VuuColumnDataType) => boolean;
}

export interface TableAttributes {
  columnDefaultWidth?: number;
  columnFormatHeader?: "capitalize" | "uppercase";
  columnSeparators?: boolean;
  showHighlightedRow?: boolean;
  rowSeparators?: boolean;
  zebraStripes?: boolean;
}

/**
 * TableConfig describes the configuration used to render a Table. It is
 * a required prop for Table and provided initially by user. It can be
 * edited using Settings Editors (Table and Column) and can be persisted
 * across sessions.
 */
export interface TableConfig extends TableAttributes {
  columns: ColumnDescriptor[];
}
export interface GridConfig extends TableConfig {
  headings: TableHeadings;
  selectionBookendWidth?: number;
}

export declare type TypeFormatting = {
  alignOnDecimals?: boolean;
  decimals?: number;
  pattern?: string;
  zeroPad?: boolean;
};

export type ColumnTypeValueMap = { [key: string]: string };

export interface EditValidationRule {
  name: string;
  message?: string;
  value?: string;
}

export interface ColumnTypeRenderer {
  associatedField?: string;
  // specific to Background renderer
  flashStyle?: "bg-only" | "arrow-bg" | "arrow";
  name: string;
  rules?: EditValidationRule[];
  // These are for the dropdown-input - how do we type parameters for custom renderers ?
  values?: ReadonlyArray<string>;
}
export interface MappedValueTypeRenderer {
  map: ColumnTypeValueMap;
}

export declare type ColumnTypeSimple =
  | "string"
  | "number"
  | "boolean"
  | "json"
  | "date"
  | "time"
  | "checkbox";

export declare type ColumnTypeDescriptor = {
  formatting?: TypeFormatting;
  name: ColumnTypeSimple;
  renderer?: ColumnTypeRenderer | MappedValueTypeRenderer;
};

export interface ColumnTypeRendererWithValidationRules
  extends ColumnTypeRenderer {
  rules: EditValidationRule[];
}

export interface ColumnTypeWithValidationRules extends ColumnTypeDescriptor {
  renderer: ColumnTypeRendererWithValidationRules;
}

export declare type ColumnType = ColumnTypeSimple | ColumnTypeDescriptor;

export type ColumnSort = VuuSortType | number;

export type PinLocation = "left" | "right" | "floating";

export type ColumnAlignment = "left" | "right";

/** This is a public description of a Column, defining all the
 * column attributes that can be defined by client. */
export interface ColumnDescriptor {
  aggregate?: VuuAggType;
  align?: ColumnAlignment;
  className?: string;
  editable?: boolean;
  flex?: number;
  /** 
   Optional additional level(s) of heading to display above label.
   May span multiple columns, if multiple adjacent columns declare 
   same heading at same level.
  */
  heading?: string[];
  hidden?: boolean;
  isSystemColumn?: boolean;
  /** The Label to display on column in Table */
  label?: string;
  locked?: boolean;
  minWidth?: number;
  name: string;
  pin?: PinLocation;
  resizeable?: boolean;
  serverDataType?: VuuColumnDataType;
  sortable?: boolean;
  type?: ColumnType;
  width?: number;
}

/** This is an internal description of a Column that extends the public
 * definitin with internal state values. */
export interface KeyedColumnDescriptor extends ColumnDescriptor {
  align?: "left" | "right";
  CellRenderer?: FunctionComponent<TableCellRendererProps>;
  className?: string;
  clientSideEditValidationCheck?: ClientSideValidationChecker;
  endPin?: true | undefined;
  filter?: Filter;
  flex?: number;
  heading?: [...string[]];
  isGroup?: boolean;
  isSystemColumn?: boolean;
  key: number;
  label: string;
  locked?: boolean;
  marginLeft?: number;
  moving?: boolean;
  /** used only when column is a child of GroupColumn  */
  originalIdx?: number;
  pinnedOffset?: number;
  resizeable?: boolean;
  resizing?: boolean;
  sortable?: boolean;
  sorted?: ColumnSort;
  type?: ColumnType;
  valueFormatter: ValueFormatter;
  width: number;
}

export interface GroupColumnDescriptor extends KeyedColumnDescriptor {
  columns: KeyedColumnDescriptor[];
  groupConfirmed: boolean;
}

export interface Heading {
  collapsed?: boolean;
  key: string;
  hidden?: boolean;
  isHeading: true;
  label: string;
  name: string;
  resizeable?: boolean;
  resizing?: boolean;
  width: number;
}

// These are the actions that eventually get routed to the DataSource itself
export type DataSourceAction =
  | GridActionCloseTreeNode
  | GridActionGroup
  | GridActionOpenTreeNode
  | GridActionSort;

export type ScrollAction =
  | GridActionScrollEndHorizontal
  | GridActionScrollStartHorizontal;

export type GridAction =
  | DataSourceAction
  | ScrollAction
  | GridActionResizeCol
  | GridActionSelection;
