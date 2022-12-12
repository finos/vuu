import { DataSource } from "@vuu-ui/vuu-data";
import { MutableRefObject } from "react";
import { VuuAggregation, VuuLink } from "../../../vuu-protocol-types";
import { AdornmentsDescriptor } from "../grid-adornments";
import { GridModelDispatch } from "../grid-context";
import { GridProps } from "../gridTypes";
import { Size } from "./useMeasuredSize";

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

export type Headings = Heading[][];

export type TypeFormatting = {
  align?: "left" | "right";
  alignOnDecimals?: boolean;
  decimals?: number;
  zeroPad?: boolean;
};

export type GridModelStatus = "pending" | "ready";
export type ColumnTypeSimple = "string" | "number";
export type ColumnTypeDescriptor = {
  formatting?: TypeFormatting;
  name: string;
  renderer?: {
    associatedField?: string;
    flashStyle?: "bg-only" | "arrow-bg" | "arrow";
    name: string;
  };
};
export type ColumnType = ColumnTypeSimple | ColumnTypeDescriptor;

export const isTypeDescriptor = (
  type?: ColumnType
): type is ColumnTypeDescriptor =>
  typeof type !== "undefined" && typeof type !== "string";

export const isNumericColumn = (type?: ColumnType) =>
  type === undefined
    ? false
    : type === "number" || (type as ColumnTypeDescriptor).name === "number";

export interface ColumnDescriptor {
  className?: string;
  flex?: number;
  heading?: [...string[]];
  isGroup?: boolean;
  isSystemColumn?: boolean;
  label?: string;
  locked?: boolean;
  marginLeft?: number;
  minWidth?: number;
  moving?: boolean;
  name: string;
  /** used only when column is a child of GroupColumn  */
  originalIdx?: number;
  resizeable?: boolean;
  resizing?: boolean;
  sortable?: boolean;
  type?: ColumnType;
  width?: number;
}

export interface KeyedColumnDescriptor extends ColumnDescriptor {
  key: number;
  width: number;
}

export interface GroupColumnDescriptor extends KeyedColumnDescriptor {
  columns: KeyedColumnDescriptor[];
}

export const isGroupColumn = (
  column: KeyedColumnDescriptor
): column is GroupColumnDescriptor => column.isGroup === true;

export type ColumnGroupType = {
  columns: KeyedColumnDescriptor[];
  contentWidth: number;
  headings?: Headings;
  isGroup: true;
  left?: number;
  locked: boolean;
  width: number;
};

export interface GroupColumnIndices {
  groupIdx: number;
  groupColIdx: number[];
}
export interface HeadingResizeState extends GroupColumnIndices {
  lastSizedCol: number;
}

export interface GridModelType
  extends Pick<
    GridProps,
    | "cellSelectionModel"
    | "columns"
    | "columnSizing"
    | "filter"
    | "groupBy"
    | "height"
    | "noColumnHeaders"
    | "renderBufferSize"
    | "showLineNumbers"
    | "sort"
    | "width"
  > {
  // Note: we override some GridProps to remove optionality
  aggregations: VuuAggregation[];
  clientHeight?: number;
  clientWidth?: number;
  columnNames?: string[];
  columnGroups?: ColumnGroupType[];
  customFooterHeight: number;
  customHeaderHeight: number;
  customInlineHeaderHeight: number;
  defaultColumnWidth: number;
  headerHeight: number;
  headingDepth: number | undefined;
  /** a transient state managed during a header resize operation */
  headingResizeState?: HeadingResizeState;
  horizontalScrollbarHeight: undefined | number;
  minColumnWidth: number;
  rowHeight: number;
  selectionModel: "none" | "checkbox" | "single" | "extended" | "multi";
  status: GridModelStatus;
  totalHeaderHeight: number;
  viewportHeight: number;
  viewportRowCount: number;
  visualLinks?: VuuLink[];
}

export interface GridModelHookProps
  extends Pick<
    GridProps,
    | "aggregations"
    | "cellSelectionModel"
    | "children"
    | "columns"
    | "columnSizing"
    | "dataSource"
    | "defaultColumnWidth"
    | "filter"
    | "groupBy"
    | "height"
    | "minColumnWidth"
    | "noColumnHeaders"
    | "renderBufferSize"
    | "selectionModel"
    | "showLineNumbers"
    | "sort"
    | "style"
    | "width"
  > {
  headerHeight: number;
  rowHeight: number;
}

export type GridModelHookResult = [
  MutableRefObject<HTMLDivElement | null>,
  GridModelType,
  DataSource,
  GridModelDispatch,
  AdornmentsDescriptor
];

export type GridModelReducerInitializerProps = Pick<
  GridModelHookProps,
  | "aggregations"
  | "cellSelectionModel"
  | "columns"
  | "columnSizing"
  | "defaultColumnWidth"
  | "filter"
  | "groupBy"
  | "headerHeight"
  | "minColumnWidth"
  | "noColumnHeaders"
  | "renderBufferSize"
  | "rowHeight"
  | "selectionModel"
  | "showLineNumbers"
  | "sort"
>;

export type GridModelReducerInitializerTuple = [
  GridModelReducerInitializerProps,
  Size,
  {
    header: { height: number };
    inlineHeader: { height: number };
    footer: { height: number };
  }
];
