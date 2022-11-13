import { DataSource } from "@finos/vuu-data";
import { DataRow, Filter } from "@finos/vuu-utils";
import React, { ReactNode, useContext, useMemo } from "react";
import {
  VuuAggregation,
  VuuColumns,
  VuuGroupBy,
  VuuSort,
} from "../../vuu-protocol-types";
import { GridModelType } from "./grid-model/gridModelTypes";

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

export interface GridActionSelection {
  type: "selection";
  idx: number;
  row: DataRow;
  rangeSelect: boolean;
  keepExistingSelection: boolean;
}

export interface GridActionRest {
  type: "group" | "resize-col" | "sort";
}

export type GridAction =
  | GridActionCloseTreeNode
  | GridActionOpenTreeNode
  | GridActionScrollEndHorizontal
  | GridActionScrollStartHorizontal
  | GridActionSelection
  | GridActionRest;

export interface GridModelActionAddCol {
  type: "add-col";
  column: unknown;
  insertIdx: number;
}

export interface GridModelActionSetAggregations {
  type: "set-aggregations";
  aggregations: VuuAggregation[];
}

export interface GridModelActionSetColumns {
  type: "set-available-columns";
  columns: VuuColumns;
}

export interface GridModelActionFilter {
  type: "filter";
  filter: Filter;
}

export interface GridModelActionGroup {
  type: "group";
  groupBy: VuuGroupBy | null;
}

export interface GridModelActionSort {
  type: "sort";
  sort: VuuSort;
}

export interface GridModelActionRest {
  type: "resize-heading" | "ROW_HEIGHT" | "set-available-columns";
}

export type GridModelAction =
  | GridModelActionAddCol
  | GridModelActionFilter
  | GridModelActionGroup
  | GridModelActionSetColumns
  | GridModelActionRest
  | GridModelActionSetAggregations
  | GridModelActionSort;

export type GridModelDispatch = (action: GridModelAction) => void;

export interface GridContext {
  custom?: unknown;
  dataSource?: DataSource;
  dispatchGridAction?: (action: GridAction) => undefined | boolean;
  dispatchGridModelAction?: GridModelDispatch;
  giidModel?: GridModelType;
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
