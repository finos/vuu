import {
  ContextMenuItemDescriptor,
  DataSource,
  DataSourceVisualLinkCreatedMessage,
  MenuActionHandler,
  MenuBuilder,
  RpcResponseHandler,
  TableSchema,
} from "@finos/vuu-data-types";
import {
  useDialogContext,
  useNotifications,
  type MenuActionClosePopup,
} from "@finos/vuu-popups";
import type {
  LinkDescriptorWithLabel,
  OpenDialogAction,
  VuuMenu,
  VuuMenuItem,
  VuuRpcResponse,
  VuuTable,
} from "@finos/vuu-protocol-types";
import { BulkEditPanel } from "@finos/vuu-table";
import {
  VuuServerMenuOptions,
  buildMenuDescriptorFromVuuMenu,
  getMenuRpcRequest,
  hasShowNotificationAction,
  isActionMessage,
  isGroupMenuItemDescriptor,
  isOpenBulkEditResponse,
  isRoot,
  isSessionTableActionMessage,
  isTableLocation,
  viewportRpcRequest,
} from "@finos/vuu-utils";
import { Button } from "@salt-ds/core";
import { useCallback } from "react";
import {
  FormConfig,
  FormFieldDescriptor,
  SessionEditingForm,
} from "../session-editing-form";

const NO_CONFIG: MenuActionConfig = {};

export type VuuMenuActionHandler = (type: string, options: unknown) => boolean;

export interface ViewServerHookResult {
  buildViewserverMenuOptions: MenuBuilder;
  handleMenuAction: MenuActionHandler;
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
  clientSideMenuActionHandler?: VuuMenuActionHandler;
  dataSource: DataSource;
  menuActionConfig?: MenuActionConfig;
  onRpcResponse?: RpcResponseHandler;
}

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

  // if (rpcName !== undefined && rpcName in static_config) {
  //   return {
  //     config: getStaticConfig(rpcName, config),
  //     schema,
  //   };
  // }

  return {
    config,
    schema,
  };
};

export const useVuuMenuActions = ({
  clientSideMenuActionHandler,
  dataSource,
  menuActionConfig = NO_CONFIG,
  onRpcResponse,
}: VuuMenuActionHookProps): ViewServerHookResult => {
  const buildViewserverMenuOptions: MenuBuilder = useCallback(
    (location, options) => {
      const { links, menu } = dataSource;
      const { visualLink } = menuActionConfig;
      const descriptors: ContextMenuItemDescriptor[] = [];

      if (location === "grid" && links && !visualLink) {
        links.forEach((linkDescriptor: LinkDescriptorWithLabel) => {
          const { link, label: linkLabel } = linkDescriptor;
          const label = linkLabel ? linkLabel : link.toTable;
          descriptors.push({
            label: `Link to ${label}`,
            action: "link-table",
            options: linkDescriptor,
          });
        });
      }

      if (menu && isTableLocation(location)) {
        const menuDescriptor = buildMenuDescriptorFromVuuMenu(
          menu,
          location,
          options as VuuServerMenuOptions,
        );
        if (isRoot(menu) && isGroupMenuItemDescriptor(menuDescriptor)) {
          descriptors.push(...menuDescriptor.children);
        } else if (menuDescriptor) {
          descriptors.push(menuDescriptor);
        }
      }

      return descriptors;
    },
    [dataSource, menuActionConfig],
  );

  const { showDialog, closeDialog } = useDialogContext();
  const showNotification = useNotifications();

  const showBulkEditDialog = useCallback(
    (table: VuuTable) => {
      const sessionDs = dataSource.createSessionDataSource?.(table);
      const handleSubmit = () => {
        sessionDs?.rpcCall?.(viewportRpcRequest("VP_BULK_EDIT_SUBMIT_RPC"));
        closeDialog();
      };

      if (sessionDs) {
        showDialog(
          <BulkEditPanel dataSource={sessionDs} onSubmit={handleSubmit} />,
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

        return true;
      }
    },
    [closeDialog, dataSource, showDialog],
  );

  const showSessionEditingForm = useCallback(
    (action: OpenDialogAction & { tableSchema: TableSchema }) => {
      const { tableSchema } = action;
      if (tableSchema) {
        const formConfig = getFormConfig(action);
        showDialog(
          <SessionEditingForm {...formConfig} onClose={closeDialog} />,
          "Set Parameters",
        );
      }

      const sessionDs = dataSource.createSessionDataSource?.(action.table);
      const handleSubmit = () => {
        sessionDs?.rpcCall?.(viewportRpcRequest("VP_BULK_EDIT_SUBMIT_RPC"));
        closeDialog();
      };

      if (sessionDs) {
        showDialog(
          <BulkEditPanel dataSource={sessionDs} onSubmit={handleSubmit} />,
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

        return true;
      }
    },
    [closeDialog, dataSource, showDialog],
  );

  const handleMenuAction = useCallback(
    ({ menuId, options }: MenuActionClosePopup) => {
      if (clientSideMenuActionHandler?.(menuId, options)) {
        return true;
      } else if (menuId === "MENU_RPC_CALL") {
        const rpcRequest = getMenuRpcRequest(options as unknown as VuuMenuItem);

        dataSource
          .menuRpcCall(rpcRequest)
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
                  showBulkEditDialog(rpcResponse.action.table);
                } else if (isSessionTableActionMessage(rpcResponse)) {
                  showSessionEditingForm(rpcResponse.action);
                }
              }
            }
          });
        return true;
      } else if (menuId === "link-table") {
        return (
          (dataSource.visualLink = options as LinkDescriptorWithLabel), true
        );
      } else {
        console.log(
          `useViewServer handleMenuAction,  can't handle action type ${menuId}`,
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
    buildViewserverMenuOptions,
    handleMenuAction,
  };
};
