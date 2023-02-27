import { ValueFormatter } from "@finos/vuu-datatable";
import { Filter } from "@finos/vuu-filter-types";
import {
  VuuAggType,
  VuuColumnDataType,
  VuuSortType,
} from "@finos/vuu-protocol-types";
import { FunctionComponent, HTMLAttributes } from "react";

export type TableSelectionModel = "none" | "single" | "checkbox" | "extended";

export type RangeTuple = [from: number, to: number];
export type SelectionItem = number | RangeTuple;
export type Selection = SelectionItem[];
export type SelectionChangeHandler = (selection: Selection) => void;

export type TableHeading = { label: string; span: number };
export type TableHeadings = TableHeading[][];

export interface TableCellProps
  extends Omit<HTMLAttributes<HTMLTableCellElement>, "onClick"> {
  column: KeyedColumnDescriptor;
  onClick?: (column: KeyedColumnDescriptor) => void;
  row: DataSourceRow;
}

export declare type GridConfig = {
  columns: ColumnDescriptor[];
  columnDefaultWidth?: number;
  columnFormatHeader?: "capitalize" | "uppercase";
  headings: TableHeadings;
};

export declare type TypeFormatting = {
  alignOnDecimals?: boolean;
  decimals?: number;
  zeroPad?: boolean;
};

export declare type ColumnTypeSimple = "string" | "number" | "boolean" | "json";
export declare type ColumnTypeDescriptor = {
  formatting?: TypeFormatting;
  name: ColumnTypeSimple;
  renderer?: {
    associatedField?: string;
    flashStyle?: "bg-only" | "arrow-bg" | "arrow";
    name: string;
  };
};

export declare type ColumnType = ColumnTypeSimple | ColumnTypeDescriptor;

export type ColumnSort = VuuSortType | number;

export type PinLocation = "left" | "right" | "floating";

/** This is a public description of a Column, defining all the
 * column attributes that can be defined by client. */
export interface ColumnDescriptor {
  aggregate?: VuuAggType;
  align?: "left" | "right";
  className?: string;
  editable?: boolean;
  expression?: string;
  flex?: number;
  heading?: string[];
  hidden?: boolean;
  isSystemColumn?: boolean;
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
  CellRenderer?: FunctionComponent<TableCellProps>;
  className?: string;
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
