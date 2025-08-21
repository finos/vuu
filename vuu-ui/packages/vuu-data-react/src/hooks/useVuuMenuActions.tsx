import { Button } from "@salt-ds/core";
import {
  type ContextMenuItemDescriptor,
  isGroupMenuItemDescriptor,
  type MenuActionHandler,
  type MenuBuilder,
} from "@vuu-ui/vuu-context-menu";
import {
  DataSource,
  DataSourceRow,
  DataSourceVisualLinkCreatedMessage,
  RpcResponseHandler,
  TableSchema,
} from "@vuu-ui/vuu-data-types";
import { getFilterPredicate } from "@vuu-ui/vuu-filter-parser";
import { useDialogContext, useNotifications } from "@vuu-ui/vuu-popups";
import type {
  ClientToServerMenuCellRPC,
  ClientToServerMenuRowRPC,
  LinkDescriptorWithLabel,
  OpenDialogAction,
  VuuDataRowDto,
  VuuMenu,
  VuuMenuContext,
  VuuMenuItem,
  VuuRowDataItemType,
  VuuRpcMenuRequest,
  VuuRpcResponse,
  VuuTable,
} from "@vuu-ui/vuu-protocol-types";
import {
  BulkEditDialog,
  BulkEditPanel,
  isTableLocation,
  TableContextMenuOptions,
  TableMenuLocation,
} from "@vuu-ui/vuu-table";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import {
  ColumnMap,
  dataSourceRowToDataRowDto,
  hasShowNotificationAction,
  isActionMessage,
  isOpenBulkEditResponse,
  isSessionTableActionMessage,
  metadataKeys,
  toColumnName,
  useData,
} from "@vuu-ui/vuu-utils";
import { useCallback } from "react";
import {
  FormConfig,
  FormFieldDescriptor,
  SessionEditingForm,
} from "../session-editing-form";

export interface VuuMenuActionHookResult {
  menuBuilder: MenuBuilder<TableMenuLocation, TableContextMenuOptions>;
  menuActionHandler: MenuActionHandler;
}

export interface MenuActionConfig {
  vuuMenu?: VuuMenu;
  visualLink?: DataSourceVisualLinkCreatedMessage;
  visualLinks?: LinkDescriptorWithLabel[];
}

export interface VuuMenuActionHookProps {
  /**
   * By default, vuuMenuActions will be handled automatically. When activated, a
   * message will be sent to server and response will be handled here too.
   * This prop allows client to provide a custom handler for a menu Item. This will
   * take priority and if handler returns true, no further processing for the menu
   * item will be handled by Vuu. This can also be used to prevent an item from being
   * actioned, even when no custom handling is intended. If the handler returns false,
   * Vuu will process the menuItem.
   */
  clientSideMenuActionHandler?: MenuActionHandler;
  dataSource?: DataSource;
  menuActionConfig?: MenuActionConfig;
  onRpcResponse?: RpcResponseHandler;
}

export interface VuuCellContextMenuItemOptions extends VuuMenuItem {
  rowKey: string;
  field: string;
  value: VuuRowDataItemType;
}
export interface VuuRowContextMenuItemOptions extends VuuMenuItem {
  rowKey: string;
  row: VuuDataRowDto;
}
export interface VuuSelectedRowsContextMenuItemOptions extends VuuMenuItem {
  columns: ColumnDescriptor[];
}

const isRoot = (menu: VuuMenu) => menu.name === "ROOT";

const isCellMenu = (
  options: VuuMenuItem,
): options is VuuCellContextMenuItemOptions => options.context === "cell";

export const isRowMenu = (
  options: VuuMenuItem,
): options is VuuRowContextMenuItemOptions => options.context === "row";

export const isSelectionMenu = (
  options: VuuMenuItem,
): options is VuuSelectedRowsContextMenuItemOptions =>
  options.context === "selected-rows";

const getColumnsFromOptions = (options: unknown) => {
  if (options && typeof options === "object" && "columns" in options) {
    return options.columns as VuuSelectedRowsContextMenuItemOptions["columns"];
  }
};

const isVuuMenuItem = (menu: VuuMenuItem | VuuMenu): menu is VuuMenuItem =>
  "rpcName" in menu;

const isGroupMenuItem = (menu: VuuMenuItem | VuuMenu): menu is VuuMenu =>
  "menus" in menu;

const hasFilter = ({ filter }: VuuMenuItem) =>
  typeof filter === "string" && filter.length > 0;

const { KEY } = metadataKeys;

const getMenuItemOptions = (
  menu: VuuMenuItem,
  options: TableContextMenuOptions,
) => {
  switch (menu.context) {
    case "cell":
      return {
        ...menu,
        field: options.column.name,
        rowKey: options.row[KEY],
        value: options.row[options.columnMap[options.column.name]],
      };
    case "row":
      return {
        ...menu,
        columns: options.columns,
        row: dataSourceRowToDataRowDto(options.row, options.columnMap),
        rowKey: options.row[KEY],
      };
    case "selected-rows":
      return {
        ...menu,
        columns: options.columns,
      };
    default:
      return menu;
  }
};

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
  options: TableContextMenuOptions,
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
    return menuItem.field === options.column.name;
  }

  return true;
};

const buildMenuDescriptorFromVuuMenu = (
  menu: VuuMenu | VuuMenuItem,
  tableLocation: TableMenuLocation,
  options: TableContextMenuOptions,
): ContextMenuItemDescriptor | undefined => {
  if (menuShouldBeRenderedInThisContext(menu, tableLocation, options)) {
    if (isVuuMenuItem(menu)) {
      return {
        label: menu.name,
        id: "MENU_RPC_CALL",
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

const keyFirst = (c1: FormFieldDescriptor, c2: FormFieldDescriptor) =>
  c1.isKeyField ? -1 : c2.isKeyField ? 1 : 0;

const defaultFormConfig = {
  fields: [],
  key: "",
  title: "",
};

const configFromSchema = (schema?: TableSchema): FormConfig | undefined => {
  if (schema) {
    const { columns, key } = schema;
    return {
      key,
      title: `Parameters for command`,
      fields: columns
        .map((col) => ({
          description: col.name,
          label: col.name,
          name: col.name,
          type: col.serverDataType,
          isKeyField: col.name === key,
        }))
        .sort(keyFirst),
    };
  }
};

const getFormConfig = (
  action: OpenDialogAction & { tableSchema: TableSchema },
) => {
  const { tableSchema: schema } = action;
  const config = configFromSchema(schema) ?? defaultFormConfig;

  return {
    config,
    schema,
  };
};

export const useVuuMenuActions = ({
  clientSideMenuActionHandler,
  dataSource,
  onRpcResponse,
}: VuuMenuActionHookProps): VuuMenuActionHookResult => {
  const { VuuDataSource } = useData();
  const menuBuilder: MenuBuilder<TableMenuLocation, TableContextMenuOptions> =
    useCallback(
      (location, options) => {
        const descriptors: ContextMenuItemDescriptor[] = [];
        if (dataSource) {
          const { links, menu } = dataSource;
          const { visualLink } = dataSource;

          if (location === "grid" && links && !visualLink) {
            links.forEach((linkDescriptor: LinkDescriptorWithLabel) => {
              const { link, label: linkLabel } = linkDescriptor;
              const label = linkLabel ? linkLabel : link.toTable;
              descriptors.push({
                label: `Link to ${label}`,
                id: "link-table",
                options: linkDescriptor,
              });
            });
          }

          if (menu && isTableLocation(location)) {
            const menuDescriptor = buildMenuDescriptorFromVuuMenu(
              menu,
              location,
              options,
            );
            if (isRoot(menu) && isGroupMenuItemDescriptor(menuDescriptor)) {
              descriptors.push(...menuDescriptor.children);
            } else if (menuDescriptor) {
              descriptors.push(menuDescriptor);
            }
          }
        } else {
          throw Error("useVuuMenuActions no dataSource provided");
        }

        return descriptors;
      },
      [dataSource],
    );

  const { showDialog, closeDialog } = useDialogContext();
  const showNotification = useNotifications();

  const showBulkEditDialog = useCallback(
    (ds: DataSource, table: VuuTable, columns?: ColumnDescriptor[]) => {
      const sessionDs = new VuuDataSource({
        columns: columns?.map(toColumnName),
        table,
        viewport: table.table,
      });

      const handleClose = () => {
        sessionDs.unsubscribe();
        closeDialog();
      };

      showDialog(
        <BulkEditDialog
          columns={columns}
          sessionDs={sessionDs}
          parentDs={ds}
          closeDialog={handleClose}
        />,
        "Bulk Amend",
      );

      return true;
    },
    [VuuDataSource, closeDialog, showDialog],
  );

  const showSessionEditingForm = useCallback(
    (
      ds: DataSource,
      action: OpenDialogAction & { tableSchema: TableSchema },
    ) => {
      const { tableSchema } = action;
      if (tableSchema) {
        const formConfig = getFormConfig(action);
        showDialog(
          <SessionEditingForm {...formConfig} onClose={closeDialog} />,
          "Set Parameters",
        );
      }

      const sessionDs = ds.createSessionDataSource?.(action.table);
      const handleSubmit = () => {
        sessionDs?.rpcRequest?.({
          params: {},
          rpcName: "VP_BULK_EDIT_SUBMIT_RPC",
          type: "RPC_REQUEST",
        });
        closeDialog();
      };

      const handleChange = (isValid: boolean) => {
        console.log("placeholder: ", isValid);
      };

      if (sessionDs) {
        showDialog(
          <BulkEditPanel
            dataSource={sessionDs}
            onSubmit={handleSubmit}
            parentDs={ds}
            onValidationStatusChange={handleChange}
          />,
          "Multi Row Edit",
          [
            <Button key="cancel" onClick={closeDialog}>
              Cancel
            </Button>,
            <Button key="submit" onClick={handleSubmit}>
              Save
            </Button>,
          ],
        );
      }
    },
    [closeDialog, showDialog],
  );

  const getMenuRpcRequest = (
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

  const menuActionHandler = useCallback<MenuActionHandler>(
    (menuItemId, options) => {
      if (clientSideMenuActionHandler?.(menuItemId, options)) {
        return true;
      } else if (menuItemId === "MENU_RPC_CALL") {
        const rpcRequest = getMenuRpcRequest(options as VuuMenuItem);

        dataSource
          ?.menuRpcCall(rpcRequest)
          .then((rpcResponse: Omit<VuuRpcResponse, "requestId">) => {
            if (rpcResponse) {
              if (onRpcResponse?.(rpcResponse) === true) {
                return true;
              }
              if (isActionMessage(rpcResponse)) {
                if (hasShowNotificationAction(rpcResponse)) {
                  const {
                    action: { message, title = "Success" },
                  } = rpcResponse;
                  showNotification({
                    type: "success",
                    body: message,
                    header: title,
                  });
                } else if (isOpenBulkEditResponse(rpcResponse)) {
                  showBulkEditDialog(
                    dataSource,
                    rpcResponse.action.table,
                    getColumnsFromOptions(options),
                  );
                } else if (isSessionTableActionMessage(rpcResponse)) {
                  showSessionEditingForm(dataSource, rpcResponse.action);
                }
              }
            }
          });
        return true;
      } else if (menuItemId === "link-table") {
        if (dataSource) {
          dataSource.visualLink = options as LinkDescriptorWithLabel;
        }
        return true;
      } else {
        console.log(
          `useViewServer handleMenuAction,  can't handle action type ${menuItemId}`,
        );
      }

      return false;
    },
    [
      clientSideMenuActionHandler,
      dataSource,
      onRpcResponse,
      showBulkEditDialog,
      showNotification,
      showSessionEditingForm,
    ],
  );

  return {
    menuBuilder,
    menuActionHandler,
  };
};
