import {
  Menu,
  MenuItem,
  MenuItemProps,
  MenuPanel,
  MenuProps,
  MenuTrigger,
} from "@salt-ds/core";
import { DataSource } from "@vuu-ui/vuu-data-types";
import {
  ColumnDescriptor,
  TableSettingsPermissions,
} from "@vuu-ui/vuu-table-types";
import {
  getGroupStatus,
  getSortStatus,
  isNumericColumn,
  logUnhandledMessage,
} from "@vuu-ui/vuu-utils";
import { MouseEventHandler, ReactElement } from "react";

type MenuElement = ReactElement<MenuProps, typeof Menu>;
type MenuItemElement = ReactElement<MenuItemProps, typeof MenuItem>;
type MenuElements = Array<MenuElement | MenuItemElement>;

export type MenuItemClickHandler = MouseEventHandler<HTMLDivElement>;

export type DataSourceColumnMenuActionType =
  | "agg-count"
  | "agg-distinct"
  | "agg-sum"
  | "agg-avg"
  | "agg-high"
  | "agg-low"
  | "sort-asc"
  | "sort-dsc"
  | "sort-add-asc"
  | "sort-add-dsc"
  | "remove-sort"
  | "group-column"
  | "remove-group"
  | "add-to-group"
  | "remove-from-group"
  | "remove-column";

export type ColumnDisplayColumnMenuActionType =
  | "pin-column-left"
  | "pin-column-right"
  | "pin-column-floating"
  | "unpin-column"
  | "hide-column";

export type TableSettingsActionType = "column-settings" | "table-settings";

export type ColumnMenuActionType =
  | DataSourceColumnMenuActionType
  | ColumnDisplayColumnMenuActionType
  | TableSettingsActionType;

export const isColumnMenuActionType = (
  value?: string,
): value is ColumnMenuActionType =>
  value !== undefined &&
  [
    "agg-count",
    "agg-distinct",
    "agg-sum",
    "agg-avg",
    "agg-high",
    "agg-low",
    "sort-asc",
    "sort-dsc",
    "sort-add-asc",
    "sort-add-dsc",
    "remove-sort",
    "group-column",
    "remove-group",
    "add-to-group",
    "remove-from-group",
    "pin-column-left",
    "pin-column-right",
    "pin-column-floating",
    "unpin-column",
    "hide-column",
    "remove-column",
    "column-settings",
    "table-settings",
  ].includes(value);

export const getColumnMenuActionType = (target: EventTarget | HTMLElement) => {
  const { menuActionId } = (target as HTMLElement).dataset;
  if (isColumnMenuActionType(menuActionId)) {
    return menuActionId;
  } else {
    throw Error(
      "[vuu-table-extras] column-menu-utils target element is not a valid Column MenuItem",
    );
  }
};

export function buildSortMenu(
  column: ColumnDescriptor,
  dataSource: DataSource,
  menuActionClickHandler: MenuItemClickHandler,
  isAllowed = true,
): MenuElement | null {
  if (!isAllowed || column.sortable === false) {
    return null;
  } else {
    const { name, label = name } = column;
    const menuItems: MenuElements = [];
    const columnSortStatus = getSortStatus(column.name, dataSource.sort);

    switch (columnSortStatus) {
      case "no-sort":
        menuItems.push(
          <MenuItem
            data-menu-action-id="sort-asc"
            key="sort-asc"
            onClick={menuActionClickHandler}
          >
            Sort ascending
          </MenuItem>,
        );
        menuItems.push(
          <MenuItem
            data-menu-action-id="sort-dsc"
            key="sort-dsc"
            onClick={menuActionClickHandler}
          >
            Sort descending
          </MenuItem>,
        );
        break;
      case "single-sort-asc":
        menuItems.push(
          <MenuItem
            data-menu-action-id="sort-dsc"
            key="sort-dsc"
            onClick={menuActionClickHandler}
          >
            Reverse Sort (DSC)
          </MenuItem>,
          <MenuItem
            data-menu-action-id="remove-sort"
            key="remove-sort"
            onClick={menuActionClickHandler}
          >
            Remove Sort
          </MenuItem>,
        );
        break;
      case "single-sort-desc":
        menuItems.push(
          <MenuItem
            data-menu-action-id="sort-asc"
            key="sort-asc"
            onClick={menuActionClickHandler}
          >
            Reverse Sort (ASC)
          </MenuItem>,
          <MenuItem
            data-menu-action-id="remove-sort"
            key="remove-sort"
            onClick={menuActionClickHandler}
          >
            Remove Sort
          </MenuItem>,
        );
        break;

      case "sort-other-column":
        menuItems.push(
          <MenuItem
            data-menu-action-id="sort-add-asc"
            key="sort-add-asc"
            onClick={menuActionClickHandler}
          >
            Add to sort ASC
          </MenuItem>,
        );
        menuItems.push(
          <MenuItem
            data-menu-action-id="sort-add-dsc"
            key="sort-add-dsc"
            onClick={menuActionClickHandler}
          >
            Add to sort DSC
          </MenuItem>,
        );
        menuItems.push(
          <MenuItem
            data-menu-action-id="sort-asc"
            key="sort-asc"
            onClick={menuActionClickHandler}
          >
            Ascending
          </MenuItem>,
        );
        menuItems.push(
          <MenuItem
            data-menu-action-id="sort-dsc"
            key="sort-dsc"
            onClick={menuActionClickHandler}
          >
            Descending
          </MenuItem>,
        );
        break;

      case "multi-sort-includes-column-asc":
      case "multi-sort-includes-column-desc":
        break;
      default:
        logUnhandledMessage(
          columnSortStatus,
          "[vuu-table-extras] column-menu-utils buildSortMenu",
        );
    }

    return (
      <Menu key="sort-menu">
        <MenuTrigger>
          <MenuItem>{`Sort by ${label}`}</MenuItem>
        </MenuTrigger>
        <MenuPanel>{menuItems}</MenuPanel>
      </Menu>
    );
  }
}

export function buildGroupMenu(
  column: ColumnDescriptor,
  dataSource: DataSource,
  menuActionClickHandler: MenuItemClickHandler,
  isAllowed = true,
): MenuElement | null {
  if (!isAllowed || column.groupable === false) {
    return null;
  } else {
    const menuItems: MenuElements = [];
    const columnGroupStatus = getGroupStatus(column.name, dataSource.groupBy);
    const { name, label = name } = column;

    switch (columnGroupStatus) {
      case "no-groupby":
        return (
          <MenuItem
            data-menu-action-id="group-column"
            key="group-column"
            onClick={menuActionClickHandler}
          >{`Group by ${label}`}</MenuItem>
        );

      case "single-groupby-other-column":
        menuItems.push(
          <MenuItem
            data-menu-action-id="group-column"
            key="group-column"
            onClick={menuActionClickHandler}
          >{`Group by ${label}`}</MenuItem>,
          <MenuItem
            data-menu-action-id="add-to-group"
            key="add-to-group"
            onClick={menuActionClickHandler}
          >{`Add ${label} to groupby`}</MenuItem>,
        );
        break;
      case "single-groupby":
        menuItems.push(
          <MenuItem
            data-menu-action-id="remove-group"
            key="remove-group"
            onClick={menuActionClickHandler}
          >
            Remove Grouping
          </MenuItem>,
        );
        break;

      case "multi-groupby-other-columns":
        menuItems.push(
          <MenuItem
            data-menu-action-id="add-to-group"
            key="add-to-group"
            onClick={menuActionClickHandler}
          >
            Add to grouping
          </MenuItem>,
        );

        break;

      case "multi-groupby-includes-column":
        menuItems.push(
          <MenuItem
            data-menu-action-id="remove-from-group"
            key="remove-from-group"
            onClick={menuActionClickHandler}
          >
            Remove from grouping
          </MenuItem>,
        );

        break;

      default:
        logUnhandledMessage(
          columnGroupStatus,
          "[vuu-table-extras] column-menu-utils buildGroupMenu",
        );
    }

    return (
      <Menu key="group-menu">
        <MenuTrigger>
          <MenuItem>Group data</MenuItem>
        </MenuTrigger>
        <MenuPanel>{menuItems}</MenuPanel>
      </Menu>
    );
  }
}

export const buildVisibilityMenuItems = (
  column: ColumnDescriptor,
  menuActionClickHandler: MenuItemClickHandler,
  allowHide = true,
  allowRemove = true,
): MenuElements | null => {
  if (!allowHide && !allowRemove) {
    return null;
  }
  const menuItems: MenuElements = [];
  const { name, label = name } = column;
  if (allowHide) {
    menuItems.push(
      <MenuItem
        data-menu-action-id="hide-column"
        key="hide-column"
        onClick={menuActionClickHandler}
      >
        {`Hide ${label} column`}
      </MenuItem>,
    );
  }
  if (allowRemove) {
    menuItems.push(
      <MenuItem
        data-menu-action-id="remove-column"
        key="remove-column"
        onClick={menuActionClickHandler}
      >
        {`Remove ${label} column`}
      </MenuItem>,
    );
  }

  return menuItems;
};

export const buildPinMenuItems = (
  column: ColumnDescriptor,
  menuActionClickHandler: MenuItemClickHandler,
  isAllowed = true,
): MenuElements => {
  if (!isAllowed || column === undefined) {
    return [];
  }
  const { pin } = column;

  const menuItems: MenuElements = [];

  const pinLeft = (
    <MenuItem
      data-menu-action-id="pin-column-left"
      key="pin-column-left"
      onClick={menuActionClickHandler}
    >
      Pin left
    </MenuItem>
  );

  const pinFloating = (
    <MenuItem
      data-menu-action-id="pin-column-floating"
      key="pin-column-floating"
      onClick={menuActionClickHandler}
    >
      Pin floating
    </MenuItem>
  );

  const pinRight = (
    <MenuItem
      data-menu-action-id="pin-column-right"
      key="pin-column-right"
      onClick={menuActionClickHandler}
    >
      Pin right
    </MenuItem>
  );

  if (pin === undefined) {
    menuItems.push(
      <Menu key="pin-menu">
        <MenuTrigger>
          <MenuItem>Pin Column</MenuItem>
        </MenuTrigger>
        <MenuPanel>
          {pinLeft}
          {pinFloating}
          {pinRight}
        </MenuPanel>
      </Menu>,
    );
  } else {
    menuItems.push(
      <MenuItem
        data-menu-action-id="unpin-column"
        key="unpin-column"
        onClick={menuActionClickHandler}
      >
        Unpin
      </MenuItem>,
    );
    if (pin === "left") {
      menuItems.push(
        <Menu key="pin-menu">
          <MenuTrigger>
            <MenuItem>Pin Column</MenuItem>
          </MenuTrigger>
          <MenuPanel>
            {pinFloating}
            {pinRight}
          </MenuPanel>
        </Menu>,
      );
    } else if (pin === "floating") {
      menuItems.push(
        <Menu key="pin-menu">
          <MenuTrigger>
            <MenuItem>Pin Column</MenuItem>
          </MenuTrigger>
          <MenuPanel>
            {pinLeft}
            {pinRight}
          </MenuPanel>
        </Menu>,
      );
    } else {
      menuItems.push(
        <Menu key="pin-menu">
          <MenuTrigger>
            <MenuItem>Pin Column</MenuItem>
          </MenuTrigger>
          <MenuPanel>
            {pinFloating}
            {pinRight}
          </MenuPanel>
        </Menu>,
      );
    }
  }

  return menuItems;
};

export const buildSettingsMenuItems = (
  _: ColumnDescriptor,
  menuActionClickHandler: MenuItemClickHandler,
  allowColumnSettings = true,
  allowTableSettings: boolean | TableSettingsPermissions = true,
): MenuElements | null => {
  if (!allowColumnSettings && !allowTableSettings) {
    return null;
  }

  const menuItems: MenuElements = [];

  if (allowColumnSettings) {
    menuItems.push(
      <MenuItem
        data-icon="settings"
        data-menu-action-id="column-settings"
        key="column-settings"
        onClick={menuActionClickHandler}
      >
        Column settings ...
      </MenuItem>,
    );
  }

  if (allowTableSettings) {
    menuItems.push(
      <MenuItem
        data-icon="settings"
        data-menu-action-id="table-settings"
        key="table-settings"
        onClick={menuActionClickHandler}
      >
        Table settings ...
      </MenuItem>,
    );
  }

  return menuItems;
};

export function buildAggregationMenuItems(
  column: ColumnDescriptor,
  dataSource: DataSource,
  menuActionClickHandler: MenuItemClickHandler,
  isAllowed = true,
): MenuElements | null {
  if (!isAllowed) {
    return null;
  }

  const { name, label = name } = column;

  if (dataSource.groupBy?.length === 0) {
    return [];
  } else {
    const menuItems: MenuElements = [
      <MenuItem
        data-menu-action-id="agg-count"
        key="agg-count"
        onClick={menuActionClickHandler}
      >
        Count
      </MenuItem>,
      <MenuItem
        data-menu-action-id="agg-distinct"
        key="agg-distinct"
        onClick={menuActionClickHandler}
      >
        Distinct
      </MenuItem>,
    ];

    if (isNumericColumn(column)) {
      menuItems.push(
        <MenuItem
          data-menu-action-id="agg-sum"
          key="agg-sum"
          onClick={menuActionClickHandler}
        >
          Sum
        </MenuItem>,
        <MenuItem
          data-menu-action-id="agg-avg"
          key="agg-avg"
          onClick={menuActionClickHandler}
        >
          Average
        </MenuItem>,
        <MenuItem
          data-menu-action-id="agg-high"
          key="agg-high"
          onClick={menuActionClickHandler}
        >
          High
        </MenuItem>,
        <MenuItem
          data-menu-action-id="agg-low"
          key="agg-low"
          onClick={menuActionClickHandler}
        >
          Low
        </MenuItem>,
      );
    }

    return [
      <Menu key="aggregate-menu">
        <MenuTrigger>
          <MenuItem>{`Aggregate ${label}`}</MenuItem>
        </MenuTrigger>
        <MenuPanel>{menuItems}</MenuPanel>
      </Menu>,
    ];
  }
}
