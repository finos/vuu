import type {
  MenuRpcAction,
  MenuRpcResponse,
  OpenDialogActionWithSchema,
  RpcResponse,
  TableSchema,
  VuuUiMessageInRequestResponse,
} from "@vuu-ui/vuu-data-types";
import {
  VuuRpcMenuRequest,
  OpenDialogAction,
  VuuRpcRequest,
  VuuRpcResponse,
  VuuRpcMenuSuccess,
  VuuTable,
  VuuViewportRpcTypeaheadRequest,
  VuuRpcServiceRequest,
  ViewportRpcContext,
  OpenComponentInDialogAction,
  VuuLoginResponse,
  SelectRequest,
  SelectResponse,
  SelectSuccessWithRowCount,
  VuuViewportCreateSuccessResponse,
  VuuViewportCreateResponse,
} from "@vuu-ui/vuu-protocol-types";
import { isView as componentInRegistry } from "./component-registry";

const MENU_RPC_TYPES = [
  "VIEW_PORT_MENUS_SELECT_RPC",
  "VIEW_PORT_MENU_TABLE_RPC",
  "VIEW_PORT_MENU_ROW_RPC",
  "VIEW_PORT_MENU_CELL_RPC",
];

export const isSelectRequest = (message: object): message is SelectRequest =>
  "type" in message &&
  (message.type === "SELECT_ROW" ||
    message.type === "DESELECT_ROW" ||
    message.type === "SELECT_ROW_RANGE" ||
    message.type === "SELECT_ALL" ||
    message.type === "DESELECT_ALL");

export const isSelectSuccessWithRowCount = (
  response: SelectResponse | SelectSuccessWithRowCount,
): response is SelectSuccessWithRowCount =>
  [
    "SELECT_ROW_SUCCESS",
    "DESELECT_ROW_SUCCESS",
    "SELECT_ROW_RANGE_SUCCESS",
    "SELECT_ALL_SUCCESS",
    "DESELECT_ALL_SUCCESS",
  ].includes(response.type ?? "") &&
  typeof (response as SelectSuccessWithRowCount).selectedRowCount === "number";

export const isRpcServiceRequest = (message: {
  type: string;
}): message is VuuRpcServiceRequest | Omit<VuuRpcServiceRequest, "context"> =>
  message.type === "RPC_REQUEST";

export const hasViewPortContext = (
  message: VuuRpcServiceRequest,
): message is VuuRpcServiceRequest<ViewportRpcContext> =>
  message.context.type === "VIEWPORT_CONTEXT";

export const isVuuMenuRpcRequest = (
  message: VuuRpcRequest | Omit<VuuRpcRequest, "vpId">,
): message is VuuRpcMenuRequest => MENU_RPC_TYPES.includes(message["type"]);

export const isLoginResponse = (message: object): message is VuuLoginResponse =>
  "type" in message &&
  (message.type === "LOGIN_SUCCESS" || message.type === "LOGIN_FAIL");

export const isRequestResponse = (
  message: object,
): message is VuuUiMessageInRequestResponse => "requestId" in message;

export const isOpenSessionTableDialogMessage = (
  rpcResponse: RpcResponse,
): rpcResponse is MenuRpcResponse<OpenDialogActionWithSchema> =>
  rpcResponse.type === "VIEW_PORT_MENU_RESP" &&
  isOpenDialogAction(rpcResponse.action) &&
  "tableSchema" in rpcResponse.action;

export const isOpenDialogAction = (
  action?: MenuRpcAction,
): action is OpenDialogAction =>
  action !== undefined && action.type === "OPEN_DIALOG_ACTION";

export const isTypeaheadRequest = (
  request: Omit<VuuRpcRequest, "vpId">,
): request is Omit<VuuViewportRpcTypeaheadRequest, "vpId"> => {
  return (
    isRpcServiceRequest(request) &&
    (request.rpcName === "getUniqueFieldValues" ||
      request.rpcName === "getUniqueFieldValuesStartingWith")
  );
};

export const isCreateVpSuccess = (
  response: VuuViewportCreateResponse,
): response is VuuViewportCreateSuccessResponse =>
  response.type === "CREATE_VP_SUCCESS";

export const isSessionTable = (table?: unknown) => {
  if (
    table !== null &&
    typeof table === "object" &&
    "table" in table &&
    "module" in table
  ) {
    return (table as VuuTable).table.startsWith("session");
  }
  return false;
};

export function isActionMessage(
  rpcResponse: VuuRpcResponse,
): rpcResponse is VuuRpcMenuSuccess;
export function isActionMessage(
  rpcResponse: Omit<VuuRpcResponse, "vpId">,
): rpcResponse is Omit<VuuRpcMenuSuccess, "vpId">;
export function isActionMessage(
  rpcResponse: VuuRpcResponse | Omit<VuuRpcResponse, "vpId">,
) {
  return rpcResponse.type === "VIEW_PORT_MENU_RESP";
}

export function isSessionTableActionMessage(
  rpcResponse: VuuRpcResponse,
): rpcResponse is VuuRpcMenuSuccess<
  OpenDialogAction & {
    tableSchema: TableSchema;
  }
>;
export function isSessionTableActionMessage(
  rpcResponse: Omit<VuuRpcResponse, "vpId">,
): rpcResponse is Omit<
  VuuRpcMenuSuccess<
    OpenDialogAction & {
      tableSchema: TableSchema;
    }
  >,
  "vpId"
>;
export function isSessionTableActionMessage(
  rpcResponse: VuuRpcResponse | Omit<VuuRpcResponse, "vpId">,
): rpcResponse is VuuRpcMenuSuccess<
  OpenDialogAction & {
    tableSchema: TableSchema;
  }
> {
  return (
    isActionMessage(rpcResponse) &&
    isOpenDialogAction(rpcResponse.action) &&
    isSessionTable(rpcResponse.action.table) &&
    rpcResponse.action?.renderComponent === "inline-form"
  );
}

export function isCustomComponentActionMessage(
  rpcResponse: VuuRpcResponse | Omit<VuuRpcResponse, "vpId">,
): rpcResponse is VuuRpcMenuSuccess<
  OpenComponentInDialogAction & {
    tableSchema: TableSchema;
  }
> {
  return (
    isActionMessage(rpcResponse) &&
    isOpenDialogAction(rpcResponse.action) &&
    isSessionTable(rpcResponse.action.table) &&
    typeof rpcResponse.action.renderComponent === "string" &&
    componentInRegistry(rpcResponse.action.renderComponent)
  );
}
