/* eslint-disable no-sequences */
import { DataSource } from "@vuu-ui/vuu-data";
import { removeColumnFromFilter } from "@vuu-ui/vuu-filters";
import { AggregationType } from "../constants";
import { GridModelDispatch } from "../grid-context";
import { GridModelType } from "../grid-model/gridModelTypes";
import { GridModel } from "../grid-model/gridModelUtils";
import { ContextMenuOptions } from "./contextMenuTypes";

const { Average, High, Low, Count, Sum } = AggregationType;
export interface ContextMenuHookProps {
  dataSource: DataSource;
  gridModel: GridModelType;
  dispatchGridModelAction: GridModelDispatch;
}

const handleRemoveColumnFromFilter = (
  menuOption: ContextMenuOptions,
  dataSource: DataSource
) => {
  if (menuOption.column && menuOption.filter) {
    const [filter, filterQuery] = removeColumnFromFilter(
      menuOption.column,
      menuOption.filter
    );
    dataSource.filter(filter, filterQuery);
    return true;
  } else {
    return false;
  }
};

export const useContextMenu = ({
  dataSource,
  gridModel,
  dispatchGridModelAction,
}: ContextMenuHookProps) => {
  /** return {boolean} used by caller to determine whether to forward to additional installed context menu handlers */
  const handleContextMenuAction = (
    type: string,
    options: ContextMenuOptions
  ): boolean => {
    if (options.column) {
      const { column } = options;
      // prettier-ignore
      switch(type){
        case "sort-asc": return dataSource.sort(GridModel.setSortColumn(gridModel, column, "A")), true;
        case "sort-dsc": return dataSource.sort(GridModel.setSortColumn(gridModel, column, "D")), true;
        case "sort-add-asc": return dataSource.sort(GridModel.addSortColumn(gridModel, column, "A")), true;
        case "sort-add-dsc": return dataSource.sort(GridModel.addSortColumn(gridModel, column, "D")), true;
        case "group": return dataSource.group(GridModel.addGroupColumn({}, column)), true;
        case "group-add": return dataSource.group(GridModel.addGroupColumn(gridModel, column)), true;
        case "column-hide": return dispatchGridModelAction({type, column}),true;
        case "filter-remove-column": return handleRemoveColumnFromFilter(options, dataSource);
        case "agg-avg": return dataSource.aggregate(GridModel.setAggregation(gridModel, column, Average)), true;
        case "agg-high": return dataSource.aggregate(GridModel.setAggregation(gridModel, column, High)), true;
        case "agg-low": return dataSource.aggregate(GridModel.setAggregation(gridModel, column, Low)), true;
        case "agg-count": return dataSource.aggregate(GridModel.setAggregation(gridModel, column, Count)), true;
        case "agg-sum": return dataSource.aggregate(GridModel.setAggregation(gridModel, column, Sum)), true;
        default:
      }
    } else if (type === "filter-remove") {
      return dataSource.filter(undefined, ""), true;
    }
    return false;
  };

  return handleContextMenuAction;
};
