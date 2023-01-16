import { DataSource } from "@finos/vuu-data";
import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { Filter } from "@finos/vuu-filter-types";
import { ContextMenuItemDescriptor, MenuBuilder } from "@finos/vuu-popups";
import { isNumericColumn } from "@finos/vuu-utils";

export type ContextMenuLocation = "header" | "filter" | "grid";

type MaybeColumn = { column?: KeyedColumnDescriptor };
type MaybeFilter = { filter?: Filter };

export const buildContextMenuDescriptors =
  (dataSource?: DataSource): MenuBuilder =>
  (location, options) => {
    const descriptors: ContextMenuItemDescriptor[] = [];
    if (dataSource === undefined) {
      return descriptors;
    }
    if (location === "header") {
      descriptors.push(
        ...buildSortMenuItems(options as MaybeColumn, dataSource)
      );
      descriptors.push(
        ...buildGroupMenuItems(options as MaybeColumn, dataSource)
      );
      descriptors.push(
        ...buildAggregationMenuItems(options as MaybeColumn, dataSource)
      );
      descriptors.push({
        label: "Hide Column",
        action: "column-hide",
        options,
      });
    } else if (location === "filter") {
      const { column, filter } = options as MaybeFilter & MaybeColumn;
      const colIsOnlyFilter = filter?.column === column?.name;
      descriptors.push({
        label: "Edit filter",
        action: "filter-edit",
        options,
      });

      descriptors.push({
        label: "Remove filter",
        action: "filter-remove-column",
        options,
      });

      if (column && !colIsOnlyFilter) {
        // TODO col might still be the only column in the filter if it is
        // involved in all clauses
        descriptors.push({
          label: `Remove all filters`,
          action: "remove-filters",
          options,
        });
      }
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

function buildSortMenuItems(
  options: MaybeColumn,
  { sort: { sortDefs } }: DataSource
): ContextMenuItemDescriptor[] {
  const { column } = options;
  const menuItems: ContextMenuItemDescriptor[] = [];
  if (column === undefined) {
    return menuItems;
  }

  const hasSort = sortDefs.length > 0;

  if (column.sorted === "A") {
    menuItems.push({
      label: "Reverse Sort (DSC)",
      action: "sort-dsc",
      options,
    });
  } else if (column.sorted === "D") {
    menuItems.push({
      label: "Reverse Sort (ASC)",
      action: "sort-asc",
      options,
    });
  } else if (typeof column.sorted === "number") {
    if (column.sorted > 0) {
      menuItems.push({
        label: "Reverse Sort (DSC)",
        action: "sort-add-dsc",
        options,
      });
    } else {
      menuItems.push({
        label: "Reverse Sort (ASC)",
        action: "sort-add-asc",
        options,
      });
    }

    // removing the last column from a sort would be a no-op, so pointless
    if (hasSort && Math.abs(column.sorted) < sortDefs.length) {
      menuItems.push({
        label: "Remove from sort",
        action: "sort-remove",
        options,
      });
    }

    menuItems.push({
      label: "New Sort",
      children: [
        { label: "Ascending", action: "sort-asc", options },
        { label: "Descending", action: "sort-dsc", options },
      ],
    });
  } else if (hasSort) {
    menuItems.push({
      label: "Add to sort",
      children: [
        { label: "Ascending", action: "sort-add-asc", options },
        { label: "Descending", action: "sort-add-dsc", options },
      ],
    });
    menuItems.push({
      label: "New Sort",
      children: [
        { label: "Ascending", action: "sort-asc", options },
        { label: "Descending", action: "sort-dsc", options },
      ],
    });
  } else {
    menuItems.push({
      label: "Sort",
      children: [
        { label: "Ascending", action: "sort-asc", options },
        { label: "Descending", action: "sort-dsc", options },
      ],
    });
  }
  return menuItems;
}

function buildAggregationMenuItems(
  options: MaybeColumn,
  dataSource: DataSource
): ContextMenuItemDescriptor[] {
  const { column } = options;
  if (column === undefined || dataSource.groupBy.length === 0) {
    return [];
  }
  const { name, label = name } = column;

  return [
    {
      label: `Aggregate ${label}`,
      children: [{ label: "Count", action: "agg-count", options }].concat(
        isNumericColumn(column)
          ? [
              { label: "Sum", action: "agg-sum", options },
              { label: "Avg", action: "agg-avg", options },
              { label: "High", action: "agg-high", options },
              { label: "Low", action: "agg-low", options },
            ]
          : []
      ),
    },
  ];
}

function buildGroupMenuItems(
  options: MaybeColumn,
  { groupBy }: DataSource
): ContextMenuItemDescriptor[] {
  const { column } = options;
  const menuItems: ContextMenuItemDescriptor[] = [];
  if (column === undefined) {
    return menuItems;
  }

  const { name, label = name } = column;

  if (groupBy.length === 0) {
    menuItems.push({
      label: `Group by ${label}`,
      action: "group",
      options,
    });
  } else {
    menuItems.push({
      label: `Add ${label} to group by`,
      action: "group-add",
      options,
    });
  }

  return menuItems;
}
