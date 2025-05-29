import {
  ContextMenuGroupItemDescriptor,
  ContextMenuItemDescriptor,
  DataSourceRow,
  MenuRpcResponse,
  OpenDialogActionWithSchema,
} from "@vuu-ui/vuu-data-types";
import { getFilterPredicate } from "@vuu-ui/vuu-filter-parser";
import {
  ClientToServerMenuCellRPC,
  ClientToServerMenuRowRPC,
  ShowNotificationAction,
  VuuMenu,
  VuuMenuContext,
  VuuMenuItem,
  VuuRpcMenuRequest,
  VuuRpcResponse,
} from "@vuu-ui/vuu-protocol-types";
import {
  ColumnDescriptor,
  TableMenuLocation,
  VuuCellMenuItem,
  VuuRowMenuItem,
} from "@vuu-ui/vuu-table-types";
import { getRowRecord, metadataKeys, type ColumnMap } from "./column-utils";

export type VuuServerMenuOptions = {
  columnMap: ColumnMap;
  columnName: string;
  columns: ColumnDescriptor[];
  row: DataSourceRow;
  selectedRows: DataSourceRow[];
  viewport: string;
};

const { KEY } = metadataKeys;

export const isRoot = (menu: VuuMenu) => menu.name === "ROOT";

export const isCellMenu = (options: VuuMenuItem): options is VuuCellMenuItem =>
  options.context === "cell";

export const isRowMenu = (options: VuuMenuItem): options is VuuRowMenuItem =>
  options.context === "row";

export const isSelectionMenu = (options: VuuMenuItem): options is VuuMenuItem =>
  options.context === "selected-rows";

export const isGroupMenuItemDescriptor = (
  menuItem?: ContextMenuItemDescriptor,
): menuItem is ContextMenuGroupItemDescriptor =>
  menuItem !== undefined && "children" in menuItem;

export const isTableLocation = (
  location: string,
): location is TableMenuLocation =>
  ["grid", "header", "filter"].includes(location);

const isVuuMenuItem = (menu: VuuMenuItem | VuuMenu): menu is VuuMenuItem =>
  "rpcName" in menu;

const isGroupMenuItem = (menu: VuuMenuItem | VuuMenu): menu is VuuMenu =>
  "menus" in menu;

const hasFilter = ({ filter }: VuuMenuItem) =>
  typeof filter === "string" && filter.length > 0;

const vuuContextCompatibleWithTableLocation = (
  uiLocation: TableMenuLocation,
  vuuContext: VuuMenuContext,
  selectedRowCount = 0,
) => {
  switch (uiLocation) {
    case "grid":
      if (vuuContext === "selected-rows") {
        return selectedRowCount > 0;
      } else {
        return true;
      }
    case "header":
      return vuuContext === "grid";
    default:
      return false;
  }
};

const gridRowMeetsFilterCriteria = (
  context: VuuMenuContext,
  row: DataSourceRow,
  selectedRows: DataSourceRow[],
  filter: string,
  columnMap: ColumnMap,
): boolean => {
  if (context === "cell" || context === "row") {
    const filterPredicate = getFilterPredicate(columnMap, filter);
    return filterPredicate(row);
  } else if (context === "selected-rows") {
    if (selectedRows.length === 0) {
      return false;
    } else {
      const filterPredicate = getFilterPredicate(columnMap, filter);
      return selectedRows.every(filterPredicate);
    }
  }
  return true;
};

const menuShouldBeRenderedInThisContext = (
  menuItem: VuuMenu | VuuMenuItem,
  tableLocation: TableMenuLocation,
  options: VuuServerMenuOptions,
): boolean => {
  if (isGroupMenuItem(menuItem)) {
    return menuItem.menus.some((childMenu) =>
      menuShouldBeRenderedInThisContext(childMenu, tableLocation, options),
    );
  }
  if (
    !vuuContextCompatibleWithTableLocation(
      tableLocation,
      menuItem.context,
      options.selectedRows?.length,
    )
  ) {
    return false;
  }

  if (tableLocation === "grid" && hasFilter(menuItem)) {
    return gridRowMeetsFilterCriteria(
      menuItem.context,
      options.row,
      options.selectedRows,
      menuItem.filter,
      options.columnMap,
    );
  }

  if (isCellMenu(menuItem) && menuItem.field !== "*") {
    return menuItem.field === options.columnName;
  }

  return true;
};

const getMenuItemOptions = (
  menu: VuuMenuItem,
  options: VuuServerMenuOptions,
): VuuMenuItem => {
  switch (menu.context) {
    case "cell":
      return {
        ...menu,
        field: options.columnName,
        rowKey: options.row[KEY],
        value: options.row[options.columnMap[options.columnName]],
      } as VuuCellMenuItem;
    case "row":
      return {
        ...menu,
        columns: options.columns,
        row: getRowRecord(options.row, options.columnMap),
        rowKey: options.row[KEY],
      } as VuuRowMenuItem;
    case "selected-rows":
      return {
        ...menu,
        columns: options.columns,
      } as any;
    default:
      return menu;
  }
};

export const buildMenuDescriptorFromVuuMenu = (
  menu: VuuMenu | VuuMenuItem,
  tableLocation: TableMenuLocation,
  options: VuuServerMenuOptions,
): ContextMenuItemDescriptor | undefined => {
  if (menuShouldBeRenderedInThisContext(menu, tableLocation, options)) {
    if (isVuuMenuItem(menu)) {
      return {
        label: menu.name,
        action: "MENU_RPC_CALL",
        options: getMenuItemOptions(menu, options),
      };
    } else {
      const children = menu.menus
        .map((childMenu) =>
          buildMenuDescriptorFromVuuMenu(childMenu, tableLocation, options),
        )
        .filter(
          (childMenu) => childMenu !== undefined,
        ) as ContextMenuItemDescriptor[];
      if (children.length > 0) {
        return {
          label: menu.name,
          children,
        };
      }
    }
  }
};

export const getMenuRpcRequest = (
  options: VuuMenuItem,
): Omit<VuuRpcMenuRequest, "vpId"> => {
  const { rpcName } = options;
  if (isCellMenu(options)) {
    return {
      field: options.field,
      rowKey: options.rowKey,
      rpcName,
      value: options.value,
      type: "VIEW_PORT_MENU_CELL_RPC",
    } as Omit<ClientToServerMenuCellRPC, "vpId">;
  } else if (isRowMenu(options)) {
    return {
      rowKey: options.rowKey,
      row: options.row,
      rpcName,
      type: "VIEW_PORT_MENU_ROW_RPC",
    } as Omit<ClientToServerMenuRowRPC, "vpId">;
  } else if (isSelectionMenu(options)) {
    return {
      rpcName,
      type: "VIEW_PORT_MENUS_SELECT_RPC",
    } as Omit<VuuRpcMenuRequest, "vpId">;
  } else {
    return {
      rpcName,
      type: "VIEW_PORT_MENU_TABLE_RPC",
    } as Omit<VuuRpcMenuRequest, "vpId">;
  }
};

export const isOpenBulkEditResponse = (
  rpcResponse: Partial<VuuRpcResponse>,
): rpcResponse is MenuRpcResponse<OpenDialogActionWithSchema> =>
  (rpcResponse as MenuRpcResponse).rpcName === "VP_BULK_EDIT_BEGIN_RPC";

export const hasShowNotificationAction = (
  res: Partial<VuuRpcResponse>,
): res is MenuRpcResponse<ShowNotificationAction> =>
  (res as MenuRpcResponse).action?.type === "SHOW_NOTIFICATION_ACTION";
