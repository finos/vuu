import {
  ContextMenuItemDescriptor,
  MenuBuilder,
} from "@vuu-ui/vuu-context-menu";
import { DataSource } from "@vuu-ui/vuu-data-types";
import { RuntimeColumnDescriptor, PinLocation } from "@vuu-ui/vuu-table-types";
import { isNumericColumn } from "@vuu-ui/vuu-utils";

export type ContextMenuLocation = "header" | "filter" | "grid";

type MaybeColumn = { column?: RuntimeColumnDescriptor };

export const buildContextMenuDescriptors =
  (dataSource?: DataSource): MenuBuilder =>
  (location, options) => {
    const descriptors: ContextMenuItemDescriptor[] = [];
    if (dataSource === undefined) {
      return descriptors;
    }
    //TODO which should it be ?
    if (location === "header" || location === "column-menu") {
      descriptors.push(
        ...buildSortMenuItems(options as MaybeColumn, dataSource),
      );
      descriptors.push(
        ...buildGroupMenuItems(options as MaybeColumn, dataSource),
      );
      descriptors.push(
        ...buildAggregationMenuItems(options as MaybeColumn, dataSource),
      );
      descriptors.push(...buildColumnDisplayMenuItems(options as MaybeColumn));
      descriptors.push({
        id: "column-settings",
        icon: "settings",
        label: `Column Settings ...`,
        options,
      });
      descriptors.push({
        id: "table-settings",
        icon: "settings",
        label: `DataGrid Settings ...`,
        options,
      });
    }

    return descriptors;
  };

function buildSortMenuItems(
  options: MaybeColumn,
  { sort: { sortDefs } }: DataSource,
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
      id: "sort-dsc",
      options,
    });
  } else if (column.sorted === "D") {
    menuItems.push({
      label: "Reverse Sort (ASC)",
      id: "sort-asc",
      options,
    });
  } else if (typeof column.sorted === "number") {
    if (column.sorted > 0) {
      menuItems.push({
        label: "Reverse Sort (DSC)",
        id: "sort-add-dsc",
        options,
      });
    } else {
      menuItems.push({
        label: "Reverse Sort (ASC)",
        id: "sort-add-asc",
        options,
      });
    }

    // removing the last column from a sort would be a no-op, so pointless
    if (hasSort && Math.abs(column.sorted) < sortDefs.length) {
      menuItems.push({
        label: "Remove from sort",
        id: "sort-remove",
        options,
      });
    }

    menuItems.push({
      label: "New Sort",
      children: [
        { label: "Ascending", id: "sort-asc", options },
        { label: "Descending", id: "sort-dsc", options },
      ],
    });
  } else if (hasSort) {
    menuItems.push({
      label: "Add to sort",
      children: [
        { label: "Ascending", id: "sort-add-asc", options },
        { label: "Descending", id: "sort-add-dsc", options },
      ],
    });
    menuItems.push({
      label: "New Sort",
      children: [
        { label: "Ascending", id: "sort-asc", options },
        { label: "Descending", id: "sort-dsc", options },
      ],
    });
  } else {
    menuItems.push({
      label: "Sort",
      children: [
        { label: "Ascending", id: "sort-asc", options },
        { label: "Descending", id: "sort-dsc", options },
      ],
    });
  }
  return menuItems;
}

function buildAggregationMenuItems(
  options: MaybeColumn,
  dataSource: DataSource,
): ContextMenuItemDescriptor[] {
  const { column } = options;
  if (column === undefined || dataSource.groupBy?.length === 0) {
    return [];
  }
  const { name, label = name } = column;

  return [
    {
      label: `Aggregate ${label}`,
      children: [
        { label: "Count", id: "agg-count", options },
        { label: "Distinct", id: "agg-distinct", options },
      ].concat(
        isNumericColumn(column)
          ? [
              { label: "Sum", id: "agg-sum", options },
              { label: "Avg", id: "agg-avg", options },
              { label: "High", id: "agg-high", options },
              { label: "Low", id: "agg-low", options },
            ]
          : [],
      ),
    },
  ];
}

const pinColumn = (options: unknown, pinLocation: PinLocation) =>
  ({
    label: `Pin ${pinLocation}`,
    id: `column-pin-${pinLocation}`,
    options,
  }) as ContextMenuItemDescriptor;

const pinLeft = (options: unknown) => pinColumn(options, "left");
const pinFloating = (options: unknown) => pinColumn(options, "floating");
const pinRight = (options: unknown) => pinColumn(options, "right");

function buildColumnDisplayMenuItems(
  options: MaybeColumn,
): ContextMenuItemDescriptor[] {
  const { column } = options;
  if (column === undefined) {
    return [];
  }
  const { pin } = column;

  const menuItems: ContextMenuItemDescriptor[] = [
    {
      label: `Hide column`,
      id: "column-hide",
      options,
    },
    {
      label: `Remove column`,
      id: "column-remove",
      options,
    },
  ];

  if (pin === undefined) {
    menuItems.push({
      label: `Pin column`,
      children: [pinLeft(options), pinFloating(options), pinRight(options)],
    });
  } else if (pin === "left") {
    menuItems.push(
      { label: "Unpin column", id: "column-unpin", options },
      {
        label: `Pin column`,
        children: [pinFloating(options), pinRight(options)],
      },
    );
  } else if (pin === "right") {
    menuItems.push(
      { label: "Unpin column", id: "column-unpin", options },
      {
        label: `Pin column`,
        children: [pinLeft(options), pinFloating(options)],
      },
    );
  } else if (pin === "floating") {
    menuItems.push(
      { label: "Unpin column", id: "column-unpin", options },
      {
        label: `Pin column`,
        children: [pinLeft(options), pinRight(options)],
      },
    );
  }

  return menuItems;
}

function buildGroupMenuItems(
  options: MaybeColumn,
  { groupBy }: DataSource,
): ContextMenuItemDescriptor[] {
  const { column } = options;
  const menuItems: ContextMenuItemDescriptor[] = [];
  if (column === undefined) {
    return menuItems;
  }

  const { name, label = name } = column;

  if (groupBy?.length === 0) {
    menuItems.push({
      label: `Group by ${label}`,
      id: "group",
      options,
    });
  } else {
    menuItems.push({
      label: `Add ${label} to group by`,
      id: "group-add",
      options,
    });
  }

  return menuItems;
}
