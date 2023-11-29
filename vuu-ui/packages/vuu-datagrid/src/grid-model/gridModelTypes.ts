import { DataSource } from "@finos/vuu-data";
import { MutableRefObject } from "react";
import { VuuAggregation, VuuLinkDescriptor } from "@finos/vuu-protocol-types";
import { AdornmentsDescriptor } from "../grid-adornments";
import { GridModelDispatch } from "../grid-context";
import { GridProps } from "../gridTypes";
import { Size } from "./useMeasuredSize";
import { Heading, RuntimeColumnDescriptor } from "@finos/vuu-datagrid-types";

export type Headings = Heading[][];

export type GridModelStatus = "pending" | "ready";

export type ColumnGroupType = {
  columns: RuntimeColumnDescriptor[];
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
  visualLinks?: VuuLinkDescriptor[];
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
