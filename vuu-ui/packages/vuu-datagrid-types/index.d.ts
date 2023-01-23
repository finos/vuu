import { Filter } from "@finos/vuu-filter-types";
import {
  VuuAggType,
  VuuColumnDataType,
  VuuSortType,
} from "@finos/vuu-protocol-types";

export declare type GridConfig = {
  columns: ColumnDescriptor[];
  columnDefaultWidth?: number;
  columnFormatHeader?: "capitalize" | "uppercase";
};

export declare type TypeFormatting = {
  alignOnDecimals?: boolean;
  decimals?: number;
  zeroPad?: boolean;
};

export declare type ColumnTypeSimple = "string" | "number";
export declare type ColumnTypeDescriptor = {
  formatting?: TypeFormatting;
  name: string;
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
  expression?: string;
  flex?: number;
  heading?: [...string[]];
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
  className?: string;
  endPin?: true;
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
  pinnedLeftOffset?: number;
  resizeable?: boolean;
  resizing?: boolean;
  sortable?: boolean;
  sorted?: ColumnSort;
  type?: ColumnType;
  width: number;
}

export interface GroupColumnDescriptor extends KeyedColumnDescriptor {
  columns: KeyedColumnDescriptor[];
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
