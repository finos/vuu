/* eslint-disable no-sequences */
import { MenuActionHandler } from "@vuu-ui/vuu-context-menu";
import { Filter } from "@vuu-ui/vuu-filter-types";
import { VuuFilter } from "@vuu-ui/vuu-protocol-types";
import {
  ColumnDescriptor,
  ColumnDisplayAction,
  RuntimeColumnDescriptor,
} from "@vuu-ui/vuu-table-types";
import {
  addGroupColumn,
  addSortColumn,
  AggregationType,
  logUnhandledMessage,
  removeGroupColumn,
  setAggregations,
  setSortColumn,
} from "@vuu-ui/vuu-utils";
import { ColumnMenuActionType } from "./column-menu-utils";
import { DisplaySettingsAction } from "./column-action-types";
import { DataSource } from "@vuu-ui/vuu-data-types";

export interface ContextMenuOptions {
  column?: RuntimeColumnDescriptor;
  filter?: Filter;
  sort?: VuuFilter;
}
export interface ContextMenuHookProps {
  dataSource: DataSource;
  onColumnDisplayAction?: (action: ColumnDisplayAction) => void;
  onDisplaySettingsAction?: (action: DisplaySettingsAction) => void;
}

const { Average, Count, Distinct, High, Low, Sum } = AggregationType;

export const useColumnActions = ({
  dataSource,
  onColumnDisplayAction,
  onDisplaySettingsAction,
}: ContextMenuHookProps) => {
  /** return {boolean} used by caller to determine whether to forward to additional installed context menu handlers */
  const handleContextMenuAction: MenuActionHandler<
    ColumnMenuActionType,
    ColumnDescriptor
  > = (columnMenuActionType, column): boolean => {
    if (column && dataSource) {
      // prettier-ignore
      switch(columnMenuActionType){
        // 1) DataSource operations ...
        case "sort-asc": return (dataSource.sort = setSortColumn(dataSource.sort, column, "A")), true;
        case "sort-dsc": return (dataSource.sort = setSortColumn(dataSource.sort, column, "D")), true;
        case "remove-sort": return (dataSource.sort = {sortDefs:[]}), true;
        case "sort-add-asc": return (dataSource.sort = addSortColumn(dataSource.sort, column, "A")), true;
        case "sort-add-dsc": return (dataSource.sort = addSortColumn(dataSource.sort, column, "D")), true;
        case "group-column": return (dataSource.groupBy = [column.name]), true;
        case "add-to-group": return (dataSource.groupBy = addGroupColumn(dataSource.groupBy ?? [], column)), true;
        case "remove-group": return (dataSource.groupBy = []), true;
        case "remove-from-group": return (dataSource.groupBy = removeGroupColumn(dataSource.groupBy ?? [], column)), true;
        case "remove-column": {
          dataSource.columns = dataSource.columns.filter(name => name !== column.name);
          onColumnDisplayAction?.({type: "removeColumn", column});
          return true;
        }
        case "agg-avg": return dataSource.aggregations = (setAggregations(dataSource.aggregations, column, Average)), true;
        case "agg-high": return dataSource.aggregations = (setAggregations(dataSource.aggregations, column, High)), true;
        case "agg-low": return dataSource.aggregations = (setAggregations(dataSource.aggregations, column, Low)), true;
        case "agg-count": return dataSource.aggregations = (setAggregations(dataSource.aggregations, column, Count)), true;
        case "agg-distinct": return dataSource.aggregations = (setAggregations(dataSource.aggregations, column, Distinct)), true;
        case "agg-sum": return dataSource.aggregations = (setAggregations(dataSource.aggregations, column, Sum)), true;
        // 2) Column display options ...
        case "hide-column": return onColumnDisplayAction?.({type: "hideColumn", column}), true;
        case "pin-column-left": return onColumnDisplayAction?.({type: "pinColumn", column, pin: "left"}), true;
        case "pin-column-right": return onColumnDisplayAction?.({type: "pinColumn", column, pin: "right"}), true;
        case "unpin-column": return onColumnDisplayAction?.({type: "pinColumn", column, pin: false}), true
        // 3) Table Admin options ...
        case "column-settings": return onDisplaySettingsAction?.({type: "column-settings", column}), true
        case "table-settings": return onDisplaySettingsAction?.({type: "table-settings"}), true
        default:
          logUnhandledMessage(columnMenuActionType, `[vuu-table-extras] useColumnActions handleContextMenuAction, unhandled columnMenuActionType`)
      }
    }
    return false;
  };

  return handleContextMenuAction;
};
