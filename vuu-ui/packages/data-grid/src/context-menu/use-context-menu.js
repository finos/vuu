/* eslint-disable no-sequences */
import { removeColumnFromFilter } from '@vuu-ui/utils';
import * as Action from './context-menu-actions';
// for now ...
import { GridModel } from '../grid-model/grid-model-utils';
import { SortType } from '../constants';

export const useContextMenu = ({ dataSource, gridModel, dispatchGridModelAction }) => {
  const handleContextMenuAction = (type, options) => {
    switch (type) {
      case Action.SortAscending:
        return (
          dataSource.sort(GridModel.setSortColumn(gridModel, options.column, SortType.ASC)), true
        );
      case Action.SortDescending:
        return (
          dataSource.sort(GridModel.setSortColumn(gridModel, options.column, SortType.DSC)), true
        );
      case Action.SortAddAscending:
        return (
          dataSource.sort(GridModel.addSortColumn(gridModel, options.column, SortType.ASC)), true
        );
      case Action.SortAddDescending:
        return (
          dataSource.sort(GridModel.addSortColumn(gridModel, options.column, SortType.DSC)), true
        );
      // case Action.SortRemove: {
      case Action.Group:
        return dataSource.group(GridModel.addGroupColumn({}, options.column)), true;
      case Action.GroupAdd:
        return dataSource.group(GridModel.addGroupColumn(gridModel, options.column)), true;
      case Action.ColumnHide:
        return dispatchGridModelAction({ type: 'column-hide', column: options.column }), true;
      case Action.FilterRemove:
        return dataSource.filterQuery('');
      case Action.FilterRemoveColumn:
        return dataSource.filterQuery(removeColumnFromFilter(options.column, options.filter));
      default:
        return false;
    }
  };

  return handleContextMenuAction;
};
