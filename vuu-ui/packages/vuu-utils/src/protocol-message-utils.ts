import type {
  MenuRpcAction,
  MenuRpcResponse,
  OpenDialogActionWithSchema,
  RpcResponse,
  VuuUIMessageOut,
  VuuUiMessageInRequestResponse,
} from "@finos/vuu-data-types";
import {
  ClientToServerMenuRPC,
  OpenDialogAction,
  VuuRpcRequest,
} from "@finos/vuu-protocol-types";

const MENU_RPC_TYPES = [
  "VIEW_PORT_MENUS_SELECT_RPC",
  "VIEW_PORT_MENU_TABLE_RPC",
  "VIEW_PORT_MENU_ROW_RPC",
  "VIEW_PORT_MENU_CELL_RPC",
  "VP_EDIT_CELL_RPC",
  "VP_EDIT_ROW_RPC",
  "VP_EDIT_ADD_ROW_RPC",
  "VP_EDIT_DELETE_CELL_RPC",
  "VP_EDIT_DELETE_ROW_RPC",
  "VP_EDIT_SUBMIT_FORM_RPC",
];

export const isVuuMenuRpcRequest = (
  message: VuuUIMessageOut | VuuRpcRequest | ClientToServerMenuRPC
): message is ClientToServerMenuRPC => MENU_RPC_TYPES.includes(message["type"]);

export const isRequestResponse = (
  message: object
): message is VuuUiMessageInRequestResponse => "requestId" in message;

export const isOpenSessionTableDialogMessage = (
  rpcResponse: RpcResponse
): rpcResponse is MenuRpcResponse<OpenDialogActionWithSchema> =>
  rpcResponse.type === "VIEW_PORT_MENU_RESP" &&
  isOpenDialogAction(rpcResponse.action) &&
  "tableSchema" in rpcResponse.action;

export const isOpenDialogAction = (
  action?: MenuRpcAction
): action is OpenDialogAction =>
  action !== undefined && action.type === "OPEN_DIALOG_ACTION";
