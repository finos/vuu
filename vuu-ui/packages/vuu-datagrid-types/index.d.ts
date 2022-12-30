import { VuuColumnDataType } from "@finos/vuu-protocol-types";

export declare type GridConfig = {
  columns: ColumnDescriptor[];
};

export declare type TypeFormatting = {
  align?: "left" | "right";
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

export interface ColumnDescriptor {
  align?: "left" | "right";
  className?: string;
  flex?: number;
  heading?: [...string[]];
  isSystemColumn?: boolean;
  label?: string;
  locked?: boolean;
  minWidth?: number;
  name: string;
  pin?: "left" | "right";
  resizeable?: boolean;
  serverDataType?: VuuColumnDataType;
  sortable?: boolean;
  type?: ColumnType;
  width?: number;
}
export interface KeyedColumnDescriptor extends ColumnDescriptor {
  align?: "left" | "right";
  className?: string;
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
  pin?: "left" | "right";
  resizeable?: boolean;
  resizing?: boolean;
  sortable?: boolean;
  type?: ColumnType;
  width?: number;
}
