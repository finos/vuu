import * as Action from './context-menu-actions';
import { SortType } from '../constants';

export const contextMenuDescriptors = [];

export const buildContextMenuDescriptors = (gridModel) => (location, options) => {
  const descriptors = [];
  if (location === 'header') {
    descriptors.push(...buildSortMenuItems(gridModel.sort, options));
    descriptors.push(...buildGroupMenuItems(gridModel.groupBy, options));
    descriptors.push({
      label: 'Hide Column',
      action: Action.ColumnHide,
      options
    });
  } else if (location === 'filter') {
    const { column, filter } = options;
    const colIsOnlyFilter = filter.column === column.name;
    descriptors.push({
      label: 'Edit filter',
      action: Action.FilterEdit,
      options
    });

    if (!colIsOnlyFilter) {
      // TODO col might still be the only column in the filter if it is
      // involved in all clauses
      descriptors.push({
        label: `Remove ${column.name} from filter`,
        action: Action.FilterRemoveColumn,
        options
      });
    }
    descriptors.push({
      label: 'Remove filter',
      action: Action.FilterRemove,
      options
    });
  }

  // if (options?.selectedRowCount){
  //   // TODO pass the table name
  //   const rpcActions = getRpcActions();
  //   for (let {label, method} of rpcActions){
  //     descriptors.push({action: Action.RpcCall, label,  options: {method}})
  //   }
  // }

  return descriptors;
};

function buildSortMenuItems(sortDefs = [], options) {
  const menuItems = [];
  const { column } = options;
  const sortColumnNames = sortDefs.map(({ column }) => column);
  const { sortType: existingColumnSort } = sortColumnNames.includes(column.name)
    ? sortDefs.find((sortDef) => sortDef.column === column.name)
    : {};

  if (existingColumnSort === SortType.ASC) {
    menuItems.push({
      label: 'Reverse Sort (DSC)',
      action: Action.SortDescending,
      options
    });
  } else if (existingColumnSort === SortType.DSC) {
    menuItems.push({
      label: 'Reverse Sort (ASC)',
      action: Action.SortAscending,
      options
    });
  } else if (typeof existingColumnSort === 'number') {
    // offer to remove if it isn't the lowest sort
    if (existingColumnSort > 0) {
      menuItems.push({
        label: 'Reverse Sort (DSC)',
        action: Action.SortAddDescending,
        options
      });
    } else {
      menuItems.push({
        label: 'Reverse Sort (ASC)',
        action: Action.SortAddAscending,
        options
      });
    }
    // removing the last column from a sort would be a no-op, so pointless
    if (Math.abs(existingColumnSort) < sortColumnNames.length) {
      menuItems.push({
        label: 'Remove from sort',
        action: Action.SortRemove,
        options
      });
    }

    menuItems.push({
      label: 'New Sort',
      children: [
        { label: 'Ascending', action: Action.SortAscending, options },
        { label: 'Descending', action: Action.SortDescending, options }
      ]
    });
  } else if (sortColumnNames) {
    menuItems.push({
      label: 'Add to sort',
      children: [
        { label: 'Ascending', action: Action.SortAddAscending, options },
        { label: 'Descending', action: Action.SortAddDescending, options }
      ]
    });
    menuItems.push({
      label: 'New Sort',
      children: [
        { label: 'Ascending', action: Action.SortAscending, options },
        { label: 'Descending', action: Action.SortDescending, options }
      ]
    });
  } else {
    menuItems.push({
      label: 'Sort',
      children: [
        { label: 'Ascending', action: Action.SortAscending, options },
        { label: 'Descending', action: Action.SortDescending, options }
      ]
    });
  }
  return menuItems;
}

function buildGroupMenuItems(groupBy, options) {
  const menuItems = [];
  const { column } = options;

  if (!groupBy) {
    menuItems.push({
      label: `Group by ${column.name}`,
      action: Action.Group,
      options
    });
  } else {
    menuItems.push({
      label: `Add ${column.name} to group by`,
      action: Action.GroupAdd,
      options
    });
  }

  return menuItems;
}
