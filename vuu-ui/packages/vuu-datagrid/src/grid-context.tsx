import { DataSource } from "@vuu-ui/vuu-data";
import { DataRow } from "@vuu-ui/vuu-utils";
import { Filter } from "@vuu-ui/vuu-filters";
import React, { ReactNode, useContext, useMemo } from "react";
import { VuuAggregation, VuuGroupBy, VuuSort } from "../../vuu-protocol-types";
import { AdornmentsDescriptor } from "./grid-adornments";
import {
  ColumnDescriptor,
  GridModelReducerInitializerProps,
  GridModelType,
  KeyedColumnDescriptor,
} from "./grid-model/gridModelTypes";
import { MeasuredSize, Size } from "./grid-model/useMeasuredSize";
import { resizePhase } from "./gridTypes";

export interface GridActionGroup {
  type: "group";
  key?: VuuGroupBy;
}
export interface GridActionScrollEndHorizontal {
  type: "scroll-end-horizontal";
  scrollLeft: number;
}

export interface GridActionScrollStartHorizontal {
  type: "scroll-start-horizontal";
  scrollLeft: number;
}

export interface GridActionCloseTreeNode {
  type: "closeTreeNode";
  key: string;
}

export interface GridActionOpenTreeNode {
  type: "openTreeNode";
  key: string;
}

export interface GridActionResizeCol {
  columnName: string;
  phase: resizePhase;
  type: "resize-col";
  width: number;
}
export interface GridActionSelection {
  type: "selection";
  idx: number;
  row: DataRow;
  rangeSelect: boolean;
  keepExistingSelection: boolean;
}
export interface GridActionSort {
  type: "sort";
  sort: VuuSort;
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

export interface GridModelActionAddCol {
  type: "add-col";
  column: KeyedColumnDescriptor;
  insertIdx: number;
}

// also a DataSourceMessage
export interface GridModelActionAggregate {
  type: "aggregate";
  aggregations: VuuAggregation[];
}

export interface GridModelActionHideColumn {
  type: "column-hide";
  column: KeyedColumnDescriptor;
}
export interface GridModelActionSetColumns {
  type: "set-available-columns";
  columns: ColumnDescriptor[];
}

export interface GridModelActionFilter {
  type: "filter";
  filter: Filter;
}
export interface GridModelActionInitialize {
  type: "initialize";
  props: GridModelReducerInitializerProps;
  size: Size;
}

export interface GridModelActionGroupBy {
  type: "groupBy";
  groupBy: VuuGroupBy | undefined;
}

export interface GridModelActionResize {
  size: MeasuredSize;
  type: "resize";
}
export interface GridModelActionResizeColumn {
  columnName: string;
  phase: resizePhase;
  type: "resize-col";
  width: number;
}
export interface GridModelActionResizeHeading {
  type: "resize-heading";
  phase: resizePhase;
  headingName: string;
  width?: number;
}
export interface GridModelActionRowHeight {
  type: "ROW_HEIGHT";
  rowHeight: number;
}
export interface GridModelActionShowColumn {
  type: "column-show";
  column: KeyedColumnDescriptor;
}
export interface GridModelActionSort {
  type: "sort";
  sort: VuuSort;
}

export interface GridModelActionSetAvailableColumns {
  type: "set-available-columns";
  columns: ColumnDescriptor[];
}

export type GridModelAction =
  | GridModelActionAddCol
  | GridModelActionFilter
  | GridModelActionGroupBy
  | GridModelActionHideColumn
  | GridModelActionInitialize
  | GridModelActionSetColumns
  | GridModelActionResize
  | GridModelActionResizeColumn
  | GridModelActionResizeHeading
  | GridModelActionSetAvailableColumns
  | GridModelActionRowHeight
  | GridModelActionAggregate
  | GridModelActionShowColumn
  | GridModelActionSort;

export type GridModelDispatch = (action: GridModelAction) => void;

export interface GridContext {
  custom?: AdornmentsDescriptor;
  dataSource?: DataSource;
  dispatchGridAction?: (action: GridAction) => undefined | boolean;
  dispatchGridModelAction?: GridModelDispatch;
  gridModel?: GridModelType;
}
const NO_CONTEXT = {};

const GridContext = React.createContext<GridContext>(NO_CONTEXT);

const chainInheritedContextValues = (
  localContext: GridContext,
  inheritedContext: GridContext
) => {
  const { dispatchGridAction: localDispatch, ...localContextValues } =
    localContext;
  const { dispatchGridAction: inheritedDispatch, ...inheritedContextValues } =
    inheritedContext;

  const dispatchGridAction = (action: GridAction) =>
    localDispatch?.(action) || inheritedDispatch?.(action) || false;

  return {
    ...inheritedContextValues,
    ...localContextValues,
    dispatchGridAction,
  };
};

interface GridProviderProps {
  children: ReactNode;
  value?: GridContext;
}

interface ProviderProps extends GridProviderProps {
  context?: GridContext;
}

const Provider = ({
  children,
  context = NO_CONTEXT,
  value = NO_CONTEXT,
}: ProviderProps) => {
  const contextValue = useMemo(() => {
    return chainInheritedContextValues(value, context);
  }, [context, value]);
  return (
    <GridContext.Provider value={contextValue}>{children}</GridContext.Provider>
  );
};

export const GridProvider = ({ children, value }: GridProviderProps) => {
  return (
    <GridContext.Consumer>
      {(parentContext) => (
        <Provider context={parentContext} value={value}>
          {children}
        </Provider>
      )}
    </GridContext.Consumer>
  );
};

export const useGridContext = () => {
  return useContext(GridContext);
};
