/* eslint-disable no-sequences */
import { DataSource } from "@finos/vuu-data";
import { DataSourceFilter, MenuActionHandler } from "@finos/vuu-data-types";
import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { MenuActionClosePopup } from "@finos/vuu-popups";
import { removeColumnFromFilter, setAggregations } from "@finos/vuu-utils";
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

const removeFilterColumn = (
  dataSourceFilter: DataSourceFilter,
  column: KeyedColumnDescriptor
) => {
  if (dataSourceFilter.filterStruct && column) {
    const [filterStruct, filter] = removeColumnFromFilter(
      column,
      dataSourceFilter.filterStruct
    );
    return {
      filter,
      filterStruct,
    };
  } else {
    return dataSourceFilter;
  }
};

export const useContextMenu = ({
  dataSource,
  gridModel,
  dispatchGridModelAction,
}: ContextMenuHookProps) => {
  /** return {boolean} used by caller to determine whether to forward to additional installed context menu handlers */
  const handleContextMenuAction: MenuActionHandler = ({
    menuId,
    options,
  }: MenuActionClosePopup): boolean => {
    const gridOptions = options as ContextMenuOptions;
    if (gridOptions.column) {
      const { column } = gridOptions;
      // prettier-ignore
      switch(menuId){
        case "sort-asc": return (dataSource.sort = GridModel.setSortColumn(gridModel, column, "A")), true;
        case "sort-dsc": return (dataSource.sort = GridModel.setSortColumn(gridModel, column, "D")), true;
        case "sort-add-asc": return (dataSource.sort = GridModel.addSortColumn(gridModel, column, "A")), true;
        case "sort-add-dsc": return (dataSource.sort = GridModel.addSortColumn(gridModel, column, "D")), true;
        case "group": return (dataSource.groupBy = GridModel.addGroupColumn({}, column)), true;
        case "group-add": return (dataSource.groupBy = GridModel.addGroupColumn(gridModel, column)), true;
        case "column-hide": return dispatchGridModelAction({type: menuId, column}),true;
        case "filter-remove-column": return (dataSource.filter = removeFilterColumn(dataSource.filter, column)), true;
        case "remove-filters": return (dataSource.filter = {filter:""}), true;
        case "agg-avg": return dataSource.aggregations = (setAggregations(dataSource.aggregations, column, Average)), true;
        case "agg-high": return dataSource.aggregations = (setAggregations(dataSource.aggregations, column, High)), true;
        case "agg-low": return dataSource.aggregations = (setAggregations(dataSource.aggregations, column, Low)), true;
        case "agg-count": return dataSource.aggregations = (setAggregations(dataSource.aggregations, column, Count)), true;
        case "agg-sum": return dataSource.aggregations = (setAggregations(dataSource.aggregations, column, Sum)), true;
        default:
      }
    }
    return false;
  };

  return handleContextMenuAction;
};
