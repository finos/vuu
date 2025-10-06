import { Menu, MenuItem, MenuPanel, MenuTrigger } from "@salt-ds/core";
import type {
  MenuRpcResponse,
  OpenDialogActionWithSchema,
} from "@vuu-ui/vuu-data-types";
import type {
  ShowNotificationAction,
  VuuRpcResponse,
} from "@vuu-ui/vuu-protocol-types";
import { MenuActionHandler } from "./ContextMenuProvider";

export interface ContextMenuItemBase {
  className?: string;
  icon?: string;
  label: string;
  location?: string;
}

export interface ContextMenuLeafItemDescriptor extends ContextMenuItemBase {
  id: string;
  options?: unknown;
}

export interface ContextMenuGroupItemDescriptor extends ContextMenuItemBase {
  children: ContextMenuItemDescriptor[];
}

export type ContextMenuItemDescriptor =
  | ContextMenuLeafItemDescriptor
  | ContextMenuGroupItemDescriptor;

export const isGroupMenuItemDescriptor = (
  menuItem?: ContextMenuItemDescriptor,
): menuItem is ContextMenuGroupItemDescriptor =>
  menuItem !== undefined && "children" in menuItem;

export const isOpenBulkEditResponse = (
  rpcResponse: Partial<VuuRpcResponse>,
): rpcResponse is MenuRpcResponse<OpenDialogActionWithSchema> =>
  (rpcResponse as MenuRpcResponse).rpcName === "VP_BULK_EDIT_BEGIN_RPC";

export const hasShowNotificationAction = (
  res: Partial<VuuRpcResponse>,
): res is MenuRpcResponse<ShowNotificationAction> =>
  (res as MenuRpcResponse).action?.type === "SHOW_NOTIFICATION_ACTION";

export const menuItemsFromMenuDescriptors = (
  menuDescriptors: ContextMenuItemDescriptor[],
  menuActionHandler: MenuActionHandler,
) => {
  const fromDescriptor = (
    menuItem: ContextMenuItemDescriptor,
    index: number,
  ) =>
    isGroupMenuItemDescriptor(menuItem) ? (
      <Menu key={index}>
        <MenuTrigger>
          <MenuItem>{menuItem.label}</MenuItem>
        </MenuTrigger>
        <MenuPanel className="vuuContextMenuPanel">
          {menuItem.children.map(fromDescriptor)}
        </MenuPanel>
      </Menu>
    ) : (
      <MenuItem
        key={index}
        className={menuItem.className}
        data-icon={menuItem.icon}
        onClick={() => menuActionHandler(menuItem.id, menuItem.options)}
      >
        {menuItem.label}
      </MenuItem>
    );

  return menuDescriptors.map(fromDescriptor);
};
