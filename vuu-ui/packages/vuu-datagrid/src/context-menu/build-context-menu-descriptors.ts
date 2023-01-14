import { MenuBuilder } from "@finos/vuu-popups";
import {
  VuuAggregation,
  VuuGroupBy,
  VuuSort,
  VuuSortCol,
} from "../../../vuu-protocol-types";
import { isNumericColumn } from "../grid-model";
import {
  GridModelType,
  KeyedColumnDescriptor,
} from "../grid-model/gridModelTypes";
import { ContextMenuOptions } from "./contextMenuTypes";

export type ContextMenuLocation = "header" | "filter" | "grid";

export type GridContextMenuAction =
  | "agg-avg"
  | "agg-count"
  | "agg-high"
  | "agg-low"
  | "agg-sum"
  | "group"
  | "group-add"
  | "sort-add-asc"
  | "sort-add-dsc"
  | "sort-asc"
  | "sort-dsc"
  | "sort-remove";

interface GridContextMenuDescriptor {
  children?: GridContextMenuDescriptor[];
  label: string;
  action?: GridContextMenuAction;
  options?: ContextMenuOptions;
}

export const buildContextMenuDescriptors =
  (
    gridModel: GridModelType
  ): MenuBuilder<ContextMenuLocation, ContextMenuOptions> =>
  (location, options) => {
    const descriptors = [];
    if (location === "header") {
      descriptors.push(...buildSortMenuItems(gridModel.sort, options));
      descriptors.push(...buildGroupMenuItems(gridModel.groupBy, options));
      descriptors.push(
        ...buildAggregationMenuItems(gridModel.aggregations, options)
      );
      descriptors.push({
        label: "Hide Column",
        action: "column-hide",
        options,
      });
    } else if (location === "filter") {
      const { column, filter } = options;
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

function buildAggregationMenuItems(
  aggregations?: VuuAggregation[],
  options?: ContextMenuOptions
) {
  const menuOptions: GridContextMenuDescriptor[] = [];
  if (options?.column) {
    const {
      column: { name, label = name, type },
    } = options;

    const menu: GridContextMenuDescriptor = {
      label: `Aggregate ${label}`,
    };

    const childMenuOptions: GridContextMenuDescriptor[] = [
      { label: "Count", action: "agg-count", options },
    ];

    if (isNumericColumn(type)) {
      childMenuOptions.push(
        { label: "Sum", action: "agg-sum", options },
        { label: "Avg", action: "agg-avg", options },
        { label: "High", action: "agg-high", options },
        { label: "Low", action: "agg-low", options }
      );
    }

    menu.children = childMenuOptions;
    menuOptions.push(menu);
  }
  return menuOptions;
}

const getSortType = (
  sortCols?: VuuSortCol[],
  column?: KeyedColumnDescriptor
): "A" | "D" | void => {
  if (sortCols && column) {
    const sortCol = sortCols.find((sortDef) => sortDef.column === column.name);
    return sortCol?.sortType;
  }
};

function buildSortMenuItems(
  sort?: VuuSort,
  options?: ContextMenuOptions
): GridContextMenuDescriptor[] {
  const sortCols = sort ? sort.sortDefs : undefined;
  const menuItems: GridContextMenuDescriptor[] = [];
  const column = options?.column;
  const existingColumnSort = getSortType(sortCols, column);
  if (existingColumnSort === "A") {
    menuItems.push({
      label: "Reverse Sort (DSC)",
      action: "sort-dsc",
      options,
    });
  } else if (existingColumnSort === "D") {
    menuItems.push({
      label: "Reverse Sort (ASC)",
      action: "sort-asc",
      options,
    });
  } else if (typeof existingColumnSort === "number") {
    // TODO this is never a number, identify from position on sortCols
    // offer to remove if it isn't the lowest sort
    if (existingColumnSort > 0) {
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
    if (sortCols && Math.abs(existingColumnSort) < sortCols.length) {
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
  } else if (sortCols) {
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

function buildGroupMenuItems(
  groupBy?: VuuGroupBy,
  options?: ContextMenuOptions
): GridContextMenuDescriptor[] {
  const menuItems: GridContextMenuDescriptor[] = [];

  if (options?.column) {
    const {
      column: { name, label = name },
    } = options;

    if (!groupBy) {
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
  }

  return menuItems;
}
