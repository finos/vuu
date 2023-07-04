import {
  DataSource,
  DataSourceMenusMessage,
  DataSourceVisualLinkCreatedMessage,
  DataSourceVisualLinkRemovedMessage,
  DataSourceVisualLinksMessage,
  MenuRpcResponse,
  VuuFeatureInvocationMessage,
  VuuFeatureMessage,
  VuuUIMessageInRPCEditReject,
  VuuUIMessageInRPCEditResponse,
} from "@finos/vuu-data";
import {
  ContextMenuItemDescriptor,
  DataSourceRow,
  MenuBuilder,
} from "@finos/vuu-data-types";
import { GridAction } from "@finos/vuu-datagrid-types";
import { getFilterPredicate } from "@finos/vuu-filter-parser";
import {
  ClientToServerMenuCellRPC,
  ClientToServerMenuRowRPC,
  ClientToServerMenuRPC,
  LinkDescriptorWithLabel,
  VuuMenu,
  VuuMenuContext,
  VuuMenuItem,
  VuuRowDataItemType,
} from "@finos/vuu-protocol-types";
import {
  ColumnMap,
  getRowRecord,
  isGroupMenuItemDescriptor,
  metadataKeys,
} from "@finos/vuu-utils";
import { useCallback } from "react";

export const addRowsFromInstruments = "addRowsFromInstruments";

export interface VuuCellMenuItem extends VuuMenuItem {
  rowKey: string;
  field: string;
  value: VuuRowDataItemType;
}
export interface VuuRowMenuItem extends VuuMenuItem {
  rowKey: string;
  row: { [key: string]: VuuRowDataItemType };
}

const { KEY } = metadataKeys;

const NO_CONFIG: MenuActionConfig = {};

// const contextSortPriorities = {
//   "selected-rows": 0,
//   cell: 1,
//   row: 2,
//   grid: 3,
// };

// const byContext = (menu1: VuuMenuItem, menu2: VuuMenuItem) => {
//   return (
//     contextSortPriorities[menu1.context] - contextSortPriorities[menu2.context]
//   );
// };

export const isVisualLinksAction = (
  action: GridAction
): action is DataSourceVisualLinksMessage => action.type === "vuu-links";

export const isVisualLinkCreatedAction = (
  action: GridAction
): action is DataSourceVisualLinkCreatedMessage =>
  action.type === "vuu-link-created";

export const isVisualLinkRemovedAction = (
  action: GridAction
): action is DataSourceVisualLinkRemovedMessage =>
  action.type === "vuu-link-removed";

export const isViewportMenusAction = (
  action: GridAction
): action is DataSourceMenusMessage => action.type === "vuu-menu";

export const isVuuFeatureAction = (
  action: GridAction
): action is VuuFeatureMessage =>
  isViewportMenusAction(action) || isVisualLinksAction(action);

export const isVuuFeatureInvocation = (
  action: GridAction
): action is VuuFeatureInvocationMessage =>
  action.type === "vuu-link-created" || action.type === "vuu-link-removed";

const isMenuItem = (menu: VuuMenuItem | VuuMenu): menu is VuuMenuItem =>
  "rpcName" in menu;

const isGroupMenuItem = (menu: VuuMenuItem | VuuMenu): menu is VuuMenu =>
  "menus" in menu;

const isRoot = (menu: VuuMenu) => menu.name === "ROOT";

const isCellMenu = (options: VuuMenuItem): options is VuuCellMenuItem =>
  options.context === "cell";
const isRowMenu = (options: VuuMenuItem): options is VuuRowMenuItem =>
  options.context === "row";
const isSelectionMenu = (options: VuuMenuItem): options is VuuMenuItem =>
  options.context === "selected-rows";

const vuuContextCompatibleWithTableLocation = (
  uiLocation: "grid" | "header" | "filter",
  vuuContext: VuuMenuContext,
  selectedRowCount = 0
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
  columnMap: ColumnMap
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

const getMenuRpcRequest = (
  options: VuuMenuItem
): Omit<ClientToServerMenuRPC, "vpId"> => {
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
    } as Omit<ClientToServerMenuRPC, "vpId">;
  } else {
    return {
      rpcName,
      type: "VIEW_PORT_MENU_TABLE_RPC",
    } as Omit<ClientToServerMenuRPC, "vpId">;
  }
};

export interface ViewServerHookResult {
  buildViewserverMenuOptions: MenuBuilder<
    TableMenuLocation,
    VuuServerMenuOptions
  >;
  handleMenuAction: (type: string, options: unknown) => boolean;
}

export interface MenuActionConfig {
  vuuMenu?: VuuMenu;
  visualLink?: DataSourceVisualLinkCreatedMessage;
  visualLinks?: LinkDescriptorWithLabel[];
}

export interface VuuMenuActionHookProps {
  dataSource: DataSource;
  menuActionConfig?: MenuActionConfig;
  onRpcResponse?: (
    response:
      | MenuRpcResponse
      | VuuUIMessageInRPCEditReject
      | VuuUIMessageInRPCEditResponse
  ) => void;
}

type TableMenuLocation = "grid" | "header" | "filter";

export type VuuServerMenuOptions = {
  columnMap: ColumnMap;
  columnName: string;
  row: DataSourceRow;
  selectedRows: DataSourceRow[];
  viewport: string;
};

const hasFilter = ({ filter }: VuuMenuItem) =>
  typeof filter === "string" && filter.length > 0;

const getMenuItemOptions = (
  menu: VuuMenuItem,
  options: VuuServerMenuOptions
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
        row: getRowRecord(options.row, options.columnMap),
        rowKey: options.row[KEY],
      } as VuuRowMenuItem;
    default:
      return menu;
  }
};

const menuShouldBeRenderedInThisContext = (
  menuItem: VuuMenu | VuuMenuItem,
  tableLocation: TableMenuLocation,
  options: VuuServerMenuOptions
): boolean => {
  if (isGroupMenuItem(menuItem)) {
    return menuItem.menus.some((childMenu) =>
      menuShouldBeRenderedInThisContext(childMenu, tableLocation, options)
    );
  }
  if (
    !vuuContextCompatibleWithTableLocation(
      tableLocation,
      menuItem.context,
      options.selectedRows?.length
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
      options.columnMap
    );
  }

  if (isCellMenu(menuItem) && menuItem.field !== "*") {
    return menuItem.field === options.columnName;
  }

  return true;
};

const buildMenuDescriptor = (
  menu: VuuMenu | VuuMenuItem,
  tableLocation: TableMenuLocation,
  options: VuuServerMenuOptions
): ContextMenuItemDescriptor | undefined => {
  if (menuShouldBeRenderedInThisContext(menu, tableLocation, options)) {
    if (isMenuItem(menu)) {
      return {
        label: menu.name,
        action: "MENU_RPC_CALL",
        options: getMenuItemOptions(menu, options),
      };
    } else {
      const children = menu.menus
        .map((childMenu) =>
          buildMenuDescriptor(childMenu, tableLocation, options)
        )
        .filter(
          (childMenu) => childMenu !== undefined
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

export const useVuuMenuActions = ({
  dataSource,
  menuActionConfig = NO_CONFIG,
  onRpcResponse,
}: VuuMenuActionHookProps): ViewServerHookResult => {
  const buildViewserverMenuOptions: MenuBuilder<
    TableMenuLocation,
    VuuServerMenuOptions
  > = useCallback(
    (tableLocation, options) => {
      const { visualLink, visualLinks, vuuMenu } = menuActionConfig;
      const descriptors: ContextMenuItemDescriptor[] = [];

      if (tableLocation === "grid" && visualLinks && !visualLink) {
        visualLinks.forEach((linkDescriptor: LinkDescriptorWithLabel) => {
          const { link, label: linkLabel } = linkDescriptor;
          const label = linkLabel ? linkLabel : link.toTable;
          descriptors.push({
            label: `Link to ${label}`,
            action: "link-table",
            options: linkDescriptor,
          });
        });
      }

      if (vuuMenu) {
        const menuDescriptor = buildMenuDescriptor(
          vuuMenu,
          tableLocation,
          options
        );
        if (isRoot(vuuMenu) && isGroupMenuItemDescriptor(menuDescriptor)) {
          descriptors.push(...menuDescriptor.children);
        } else if (menuDescriptor) {
          descriptors.push(menuDescriptor);
        }
      }

      return descriptors;
    },
    [menuActionConfig]
  );

  const handleMenuAction = useCallback(
    (type: string, options: unknown) => {
      if (type === "MENU_RPC_CALL") {
        const rpcRequest = getMenuRpcRequest(options as VuuMenuItem);
        dataSource.menuRpcCall(rpcRequest).then((rpcResponse) => {
          if (onRpcResponse && rpcResponse) {
            onRpcResponse && onRpcResponse(rpcResponse);
          }
        });
        return true;
      } else if (type === "link-table") {
        // return dataSource.createLink(options as LinkDescriptorWithLabel), true;
        return (
          (dataSource.visualLink = options as LinkDescriptorWithLabel), true
        );
      } else {
        console.log(
          `useViewServer handleMenuAction,  can't handle action type ${type}`
        );
      }
      return false;
    },
    [dataSource, onRpcResponse]
  );

  return {
    buildViewserverMenuOptions,
    handleMenuAction,
  };
};
