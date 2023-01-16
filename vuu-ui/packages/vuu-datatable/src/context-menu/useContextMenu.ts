/* eslint-disable no-sequences */
import { DataSource, DataSourceFilter } from "@finos/vuu-data";
import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { Filter } from "@finos/vuu-filter-types";
import { removeColumnFromFilter } from "@finos/vuu-filters";
import { MenuActionHandler } from "@finos/vuu-popups";
import { VuuFilter } from "@finos/vuu-protocol-types";
import { ColumnActionDispatch } from "../useTableModel";
import { addSortColumn, setSortColumn } from "@finos/vuu-utils";

export interface ContextMenuOptions {
  column?: KeyedColumnDescriptor;
  filter?: Filter;
  sort?: VuuFilter;
}
export interface ContextMenuHookProps {
  dataSource?: DataSource;
  dispatchColumnAction: ColumnActionDispatch;
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
  dispatchColumnAction,
}: ContextMenuHookProps) => {
  /** return {boolean} used by caller to determine whether to forward to additional installed context menu handlers */
  const handleContextMenuAction: MenuActionHandler = (
    type,
    options
  ): boolean => {
    const gridOptions = options as ContextMenuOptions;
    if (gridOptions.column && dataSource) {
      const { column } = gridOptions;
      // prettier-ignore
      switch(type){
        case "sort-asc": return (dataSource.sort = setSortColumn(dataSource.sort, column, "A")), true;
        case "sort-dsc": return (dataSource.sort = setSortColumn(dataSource.sort, column, "D")), true;
        case "sort-add-asc": return (dataSource.sort = addSortColumn(dataSource.sort, column, "A")), true;
        case "sort-add-dsc": return (dataSource.sort = addSortColumn(dataSource.sort, column, "D")), true;
        // case "group": return (dataSource.groupBy = GridModel.addGroupColumn({}, column)), true;
        // case "group-add": return (dataSource.groupBy = GridModel.addGroupColumn(gridModel, column)), true;
        // case "column-hide": return dispatchColumnAction({type, column}),true;
        case "filter-remove-column": return (dataSource.filter = removeFilterColumn(dataSource.filter, column)), true;
        case "remove-filters": return (dataSource.filter = {filter:""}), true;
        // case "agg-avg": return dataSource.aggregate(GridModel.setAggregation(gridModel, column, Average)), true;
        // case "agg-high": return dataSource.aggregate(GridModel.setAggregation(gridModel, column, High)), true;
        // case "agg-low": return dataSource.aggregate(GridModel.setAggregation(gridModel, column, Low)), true;
        // case "agg-count": return dataSource.aggregate(GridModel.setAggregation(gridModel, column, Count)), true;
        // case "agg-sum": return dataSource.aggregate(GridModel.setAggregation(gridModel, column, Sum)), true;
        default:
      }
    }
    return false;
  };

  return handleContextMenuAction;
};
