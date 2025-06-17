import {
  MenuRpcResponse,
  OpenDialogActionWithSchema,
} from "@vuu-ui/vuu-data-types";
import {
  ShowNotificationAction,
  VuuRpcResponse,
} from "@vuu-ui/vuu-protocol-types";
import {
  ContextMenuGroupItemDescriptor,
  ContextMenuItemDescriptor,
} from "@vuu-ui/vuu-context-menu";

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
