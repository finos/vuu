/* eslint-disable no-sequences */
import { DataSource } from "@finos/vuu-data";
import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { Filter } from "@finos/vuu-filter-types";
import { removeColumnFromFilter } from "@finos/vuu-filters";
import { MenuActionHandler } from "@finos/vuu-popups";
import { VuuFilter } from "@finos/vuu-protocol-types";
import { DataSourceFilter } from "@finos/vuu-data-types";
import { PersistentColumnAction } from "../useTableModel";
import {
  addGroupColumn,
  addSortColumn,
  AggregationType,
  setAggregations,
  setSortColumn,
} from "@finos/vuu-utils";

export interface ContextMenuOptions {
  column?: KeyedColumnDescriptor;
  filter?: Filter;
  sort?: VuuFilter;
}
export interface ContextMenuHookProps {
  dataSource?: DataSource;
  onPersistentColumnOperation: (action: PersistentColumnAction) => void;
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

const { Average, Count, High, Low, Sum } = AggregationType;

export const useContextMenu = ({
  dataSource,
  onPersistentColumnOperation,
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
        case "group": return (dataSource.groupBy = addGroupColumn(dataSource.groupBy, column)), true;
        case "group-add": return (dataSource.groupBy = addGroupColumn(dataSource.groupBy, column)), true;
        case "column-hide": return onPersistentColumnOperation({type: "hideColumns", columns: [column]}), true;
        case "column-remove": return (dataSource.columns = dataSource.columns.filter(name => name !== column.name)), true
        case "filter-remove-column": return (dataSource.filter = removeFilterColumn(dataSource.filter, column)), true;
        case "remove-filters": return (dataSource.filter = {filter:""}), true;
        case "agg-avg": return dataSource.aggregations = (setAggregations(dataSource.aggregations, column, Average)), true;
        case "agg-high": return dataSource.aggregations = (setAggregations(dataSource.aggregations, column, High)), true;
        case "agg-low": return dataSource.aggregations = (setAggregations(dataSource.aggregations, column, Low)), true;
        case "agg-count": return dataSource.aggregations = (setAggregations(dataSource.aggregations, column, Count)), true;
        case "agg-sum": return dataSource.aggregations = (setAggregations(dataSource.aggregations, column, Sum)), true;
        case "column-pin-floating": return onPersistentColumnOperation({type: "pinColumn", column, pin: "floating"}), true;
        case "column-pin-left": return onPersistentColumnOperation({type: "pinColumn", column, pin: "left"}), true;
        case "column-pin-right": return onPersistentColumnOperation({type: "pinColumn", column, pin: "right"}), true;
        case "column-unpin": return onPersistentColumnOperation({type: "pinColumn", column, pin: undefined}), true
        default:
      }
    }
    return false;
  };

  return handleContextMenuAction;
};
