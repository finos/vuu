import { VuuMenuRpcRequest, VuuRpcRequest } from "@finos/vuu-protocol-types";
import { VuuUIMessageOut } from "./vuuUIMessageTypes";

const MENU_RPC_TYPES = [
  "VIEW_PORT_MENUS_SELECT_RPC",
  "VIEW_PORT_MENU_TABLE_RPC",
  "VIEW_PORT_MENU_ROW_RPC",
  "VIEW_PORT_MENU_CELL_RPC",
];

export const isVuuMenuRpcRequest = (
  message: VuuUIMessageOut | VuuRpcRequest | VuuMenuRpcRequest
): message is VuuMenuRpcRequest => MENU_RPC_TYPES.includes(message["type"]);

export type WithRequestId<T> = T & { requestId: string };

export const stripRequestId = <T>({
  requestId,
  ...rest
}: WithRequestId<T>): [string, T] => [requestId, rest as T];
