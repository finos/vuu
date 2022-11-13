/* eslint-disable no-sequences */
import { removeColumnFromFilter } from "@finos/vuu-utils";
import * as Action from "./context-menu-actions";
// for now ...
import { GridModel } from "../grid-model/gridModelUtils";
import { AggregationType, SortType } from "../constants";

export const useContextMenu = ({
  dataSource,
  gridModel,
  dispatchGridModelAction,
}) => {
  const handleContextMenuAction = (type, options) => {
    switch (type) {
      case Action.SortAscending:
        return (
          dataSource.sort(
            GridModel.setSortColumn(gridModel, options.column, SortType.ASC)
          ),
          true
        );
      case Action.SortDescending:
        return (
          dataSource.sort(
            GridModel.setSortColumn(gridModel, options.column, SortType.DSC)
          ),
          true
        );
      case Action.SortAddAscending:
        return (
          dataSource.sort(
            GridModel.addSortColumn(gridModel, options.column, SortType.ASC)
          ),
          true
        );
      case Action.SortAddDescending:
        return (
          dataSource.sort(
            GridModel.addSortColumn(gridModel, options.column, SortType.DSC)
          ),
          true
        );
      case Action.AggregateAvg:
        return (
          dataSource.aggregate(
            GridModel.setAggregation(
              gridModel,
              options.column,
              AggregationType.Average
            )
          ),
          true
        );
      case Action.AggregateHigh:
        return (
          dataSource.aggregate(
            GridModel.setAggregation(
              gridModel,
              options.column,
              AggregationType.High
            )
          ),
          true
        );
      case Action.AggregateLow:
        return (
          dataSource.aggregate(
            GridModel.setAggregation(
              gridModel,
              options.column,
              AggregationType.Low
            )
          ),
          true
        );
      case Action.AggregateCount:
        return (
          dataSource.aggregate(
            GridModel.setAggregation(
              gridModel,
              options.column,
              AggregationType.Count
            )
          ),
          true
        );
      case Action.AggregateSum:
        return (
          dataSource.aggregate(
            GridModel.setAggregation(
              gridModel,
              options.column,
              AggregationType.Sum
            )
          ),
          true
        );
      // case Action.SortRemove: {
      case Action.Group:
        return (
          dataSource.group(GridModel.addGroupColumn({}, options.column)), true
        );
      case Action.GroupAdd:
        return (
          dataSource.group(GridModel.addGroupColumn(gridModel, options.column)),
          true
        );
      case Action.ColumnHide:
        return (
          dispatchGridModelAction({
            type: "column-hide",
            column: options.column,
          }),
          true
        );
      case Action.FilterRemove:
        return dataSource.filter(null);
      case Action.FilterRemoveColumn: {
        const filter = removeColumnFromFilter(options.column, options.filter);
        return dataSource.filter(filter);
      }
      default:
        return false;
    }
  };

  return handleContextMenuAction;
};
