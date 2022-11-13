import { DataSource } from "@finos/vuu-data";
import { MutableRefObject } from "react";
import { VuuAggregation, VuuLink } from "../../../vuu-protocol-types";
import { AdornmentsDescriptor } from "../grid-adornments";
import { GridModelDispatch } from "../grid-context";
import { ColumnDescriptor, GridProps } from "../gridTypes";
import { SizeState } from "./useSize";

export interface KeyedColumnDescriptor extends ColumnDescriptor {
  key: number;
}

export type ColumnGroupType = {
  columns: KeyedColumnDescriptor[];
};

export interface GridModelType
  extends Pick<
    GridProps,
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
  > {
  aggregations: VuuAggregation[];
  assignedHeight: SizeState["height"];
  assignedWidth: SizeState["width"];
  columnNames: null | string[];
  columnGroups?: ColumnGroupType[];
  customFooterHeight?: number;
  customHeaderHeight?: number;
  customInlineHeaderHeight?: number;
  headingDepth: number | undefined;
  height: string | number | undefined | null;
  horizontalScrollbarHeight: undefined | number;
  totalHeaderHeight: number;
  viewportHeight: number;
  viewportRowCount: number;
  visualLinks: VuuLink[];
  width: string | number | undefined | null;
}

export type GridModelHookProps = Pick<
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
  | "headerHeight"
  | "height"
  | "minColumnWidth"
  | "noColumnHeaders"
  | "renderBufferSize"
  | "rowHeight"
  | "selectionModel"
  | "showLineNumbers"
  | "sort"
  | "style"
  | "width"
>;
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
  SizeState,
  unknown
];
