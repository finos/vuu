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
  VuuRpcEditCellRequest,
  VuuRowDataItemType,
  VuuRpcRequest,
  VuuRpcEditAddRowRequest,
  VuuDataRowDto,
  VuuRpcEditDeleteRowRequest,
  VuuRpcViewportRequest,
  VuuRpcResponse,
  VuuRpcMenuSuccess,
  VuuTable,
  VuuRpcViewportResponse,
} from "@vuu-ui/vuu-protocol-types";

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
  message: VuuRpcRequest | Omit<VuuRpcRequest, "vpId">,
): message is VuuRpcMenuRequest => MENU_RPC_TYPES.includes(message["type"]);

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

export function isViewportRpcRequest(
  request: VuuRpcRequest,
): request is VuuRpcViewportRequest;
export function isViewportRpcRequest(
  request: Omit<VuuRpcRequest, "vpId">,
): request is Omit<VuuRpcViewportRequest, "vpId">;
export function isViewportRpcRequest(
  request: Omit<VuuRpcRequest, "vpId">,
): request is VuuRpcViewportRequest | Omit<VuuRpcViewportRequest, "vpId"> {
  return request.type === "VIEW_PORT_RPC_CALL";
}

export function isEditCellRequest(
  request: VuuRpcRequest,
): request is VuuRpcEditCellRequest;
export function isEditCellRequest(
  request: Omit<VuuRpcRequest, "vpId">,
): request is Omit<VuuRpcEditCellRequest, "vpId">;
export function isEditCellRequest(
  request: VuuRpcRequest | Omit<VuuRpcRequest, "vpId">,
): request is VuuRpcEditCellRequest | Omit<VuuRpcEditCellRequest, "vpId"> {
  return request.type === "VP_EDIT_CELL_RPC";
}

export function vuuEditCellRequest(
  rowKey: string,
  field: string,
  value: VuuRowDataItemType,
  vpId: string,
): VuuRpcEditCellRequest;
export function vuuEditCellRequest(
  rowKey: string,
  field: string,
  value: VuuRowDataItemType,
): Omit<VuuRpcEditCellRequest, "vpId">;
export function vuuEditCellRequest(
  rowKey: string,
  field: string,
  value: VuuRowDataItemType,
  vpId?: string,
): VuuRpcEditCellRequest | Omit<VuuRpcEditCellRequest, "vpId"> {
  return {
    rowKey,
    field,
    value,
    type: "VP_EDIT_CELL_RPC",
    vpId,
  };
}

export function viewportRpcRequest(
  rpcName: string,
  vpId: string,
): VuuRpcViewportRequest;
export function viewportRpcRequest(
  rpcName: string,
): Omit<VuuRpcViewportRequest, "vpId">;
export function viewportRpcRequest(
  rpcName: string,
  vpId?: string,
): VuuRpcViewportRequest | Omit<VuuRpcViewportRequest, "vpId"> {
  return {
    namedParams: {},
    params: [],
    rpcName,
    type: "VIEW_PORT_RPC_CALL",
    vpId,
  };
}

export function vuuAddRowRequest(
  rowKey: string,
  data: VuuDataRowDto,
  vpId: string,
): VuuRpcEditAddRowRequest;
export function vuuAddRowRequest(
  rowKey: string,
  data: VuuDataRowDto,
): Omit<VuuRpcEditAddRowRequest, "vpId">;
export function vuuAddRowRequest(
  rowKey: string,
  data: VuuDataRowDto,
  vpId?: string,
): VuuRpcEditAddRowRequest | Omit<VuuRpcEditAddRowRequest, "vpId"> {
  return {
    rowKey,
    data,
    type: "VP_EDIT_ADD_ROW_RPC",
    vpId,
  };
}

export function vuuDeleteRowRequest(
  rowKey: string,
  vpId: string,
): VuuRpcEditDeleteRowRequest;
export function vuuDeleteRowRequest(
  rowKey: string,
): Omit<VuuRpcEditDeleteRowRequest, "vpId">;
export function vuuDeleteRowRequest(
  rowKey: string,
  vpId?: string,
): VuuRpcEditDeleteRowRequest | Omit<VuuRpcEditDeleteRowRequest, "vpId"> {
  return {
    rowKey,
    type: "VP_EDIT_DELETE_ROW_RPC",
    vpId,
  };
}

// export type WithTableSchema<
//   T extends VuuRpcMenuSuccess | VuuRpcViewportResponse = VuuRpcMenuSuccess,
// > = T & {
//   action: T extends VuuRpcMenuSuccess
//     ? VuuRpcMenuSuccess["action"] & { tableSchema: TableSchema }
//     : VuuRpcViewportResponse["action"] & { tableSchema: TableSchema };
// };

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
): rpcResponse is VuuRpcViewportResponse | VuuRpcMenuSuccess;
export function isActionMessage(
  rpcResponse: Omit<VuuRpcResponse, "vpId">,
): rpcResponse is
  | Omit<VuuRpcViewportResponse, "vpId">
  | Omit<VuuRpcMenuSuccess, "vpId">;
export function isActionMessage(
  rpcResponse: VuuRpcResponse | Omit<VuuRpcResponse, "vpId">,
) {
  return (
    rpcResponse.type === "VIEW_PORT_MENU_RESP" ||
    rpcResponse.type === "VIEW_PORT_RPC_REPONSE"
  );
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

export const isRpcSuccess = (
  response: VuuRpcResponse | Omit<VuuRpcResponse, "vpId">,
): response is VuuRpcViewportResponse =>
  isActionMessage(response) && response.action.type === "VP_RPC_SUCCESS";
