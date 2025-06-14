/* eslint-disable no-sequences */
import { MenuActionHandler } from "@vuu-ui/vuu-context-menu";
import { DataSource, DataSourceFilter } from "@vuu-ui/vuu-data-types";
import { Filter } from "@vuu-ui/vuu-filter-types";
import { VuuFilter } from "@vuu-ui/vuu-protocol-types";
import {
  ColumnDescriptor,
  RuntimeColumnDescriptor,
} from "@vuu-ui/vuu-table-types";
import {
  addGroupColumn,
  addSortColumn,
  AggregationType,
  removeColumnFromFilter,
  setAggregations,
  setSortColumn,
} from "@vuu-ui/vuu-utils";
import { PersistentColumnAction } from "../useTableModel";
import { ColumnMenuActionType } from "./column-menu-utils";

export interface ContextMenuOptions {
  column?: RuntimeColumnDescriptor;
  filter?: Filter;
  sort?: VuuFilter;
}
export interface ContextMenuHookProps {
  dataSource?: DataSource;
  /**
   * A persistent Column Operation is any manipulation of a table column that should be
   * persisted across user sessions. e.g. if user pins a column, column should still be
   * pinned next time user opens app.
   */
  onPersistentColumnOperation: (action: PersistentColumnAction) => void;
}

const removeFilterColumn = (
  dataSourceFilter: DataSourceFilter,
  column: RuntimeColumnDescriptor,
) => {
  if (dataSourceFilter.filterStruct && column) {
    const [filterStruct, filter] = removeColumnFromFilter(
      column,
      dataSourceFilter.filterStruct,
    );
    return {
      filter,
      filterStruct,
    };
  } else {
    return dataSourceFilter;
  }
};

const { Average, Count, Distinct, High, Low, Sum } = AggregationType;

export const useColumnActions = ({
  dataSource,
  onPersistentColumnOperation,
}: ContextMenuHookProps) => {
  /** return {boolean} used by caller to determine whether to forward to additional installed context menu handlers */
  const handleContextMenuAction: MenuActionHandler<
    ColumnMenuActionType,
    ColumnDescriptor
  > = (menuItemId, column): boolean => {
    if (column && dataSource) {
      // prettier-ignore
      switch(menuItemId){
        case "sort-asc": return (dataSource.sort = setSortColumn(dataSource.sort, column, "A")), true;
        case "sort-dsc": return (dataSource.sort = setSortColumn(dataSource.sort, column, "D")), true;
        case "remove-sort": return (dataSource.sort = {sortDefs:[]}), true;
        case "sort-add-asc": return (dataSource.sort = addSortColumn(dataSource.sort, column, "A")), true;
        case "sort-add-dsc": return (dataSource.sort = addSortColumn(dataSource.sort, column, "D")), true;
        case "group-column": return (dataSource.groupBy = addGroupColumn(dataSource.groupBy ?? [], column)), true;
        case "group-add": return (dataSource.groupBy = addGroupColumn(dataSource.groupBy ?? [], column)), true;
        case "hide-column": return onPersistentColumnOperation({type: "hideColumns", columns: [column]}), true;
        case "remove-column": return (dataSource.columns = dataSource.columns.filter(name => name !== column.name)), true
        case "filter-remove-column": return (dataSource.filter = removeFilterColumn(dataSource.filter, column)), true;
        case "remove-filters": return (dataSource.filter = {filter:""}), true;
        case "agg-avg": return dataSource.aggregations = (setAggregations(dataSource.aggregations, column, Average)), true;
        case "agg-high": return dataSource.aggregations = (setAggregations(dataSource.aggregations, column, High)), true;
        case "agg-low": return dataSource.aggregations = (setAggregations(dataSource.aggregations, column, Low)), true;
        case "agg-count": return dataSource.aggregations = (setAggregations(dataSource.aggregations, column, Count)), true;
        case "agg-distinct": return dataSource.aggregations = (setAggregations(dataSource.aggregations, column, Distinct)), true;
        case "agg-sum": return dataSource.aggregations = (setAggregations(dataSource.aggregations, column, Sum)), true;
        case "pin-column-floating": return onPersistentColumnOperation({type: "pinColumn", column, pin: "floating"}), true;
        case "pin-column-left": return onPersistentColumnOperation({type: "pinColumn", column, pin: "left"}), true;
        case "pin-column-right": return onPersistentColumnOperation({type: "pinColumn", column, pin: "right"}), true;
        case "unpin-column": return onPersistentColumnOperation({type: "pinColumn", column, pin: undefined}), true
        case "column-settings": return onPersistentColumnOperation({type: "columnSettings", column}), true
        case "table-settings": return onPersistentColumnOperation({type: "tableSettings"}), true
        default:
      }
    }
    return false;
  };

  return handleContextMenuAction;
};
