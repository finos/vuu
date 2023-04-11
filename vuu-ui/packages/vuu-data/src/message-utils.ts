import {
  ClientToServerMenuRPC,
  VuuRow,
  VuuRpcRequest,
} from "@finos/vuu-protocol-types";
import { VuuUIMessageOut } from "./vuuUIMessageTypes";

const MENU_RPC_TYPES = [
  "VIEW_PORT_MENUS_SELECT_RPC",
  "VIEW_PORT_MENU_TABLE_RPC",
  "VIEW_PORT_MENU_ROW_RPC",
  "VIEW_PORT_MENU_CELL_RPC",
];

export const isVuuMenuRpcRequest = (
  message: VuuUIMessageOut | VuuRpcRequest | ClientToServerMenuRPC
): message is ClientToServerMenuRPC => MENU_RPC_TYPES.includes(message["type"]);

export type WithRequestId<T> = T & { requestId: string };

export const stripRequestId = <T>({
  requestId,
  ...rest
}: WithRequestId<T>): [string, T] => [requestId, rest as T];

export const getFirstAndLastRows = (
  rows: VuuRow[]
): [VuuRow, VuuRow] | [VuuRow] => {
  let firstRow = rows.at(0) as VuuRow;
  if (firstRow.updateType === "SIZE") {
    if (rows.length === 1) {
      return rows as [VuuRow];
    } else {
      firstRow = rows.at(1) as VuuRow;
    }
  }
  const lastRow = rows.at(-1) as VuuRow;
  return [firstRow, lastRow];
};
