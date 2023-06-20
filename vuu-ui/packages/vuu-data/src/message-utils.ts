import {
  ClientToServerMenuRPC,
  VuuColumnDataType,
  VuuRow,
  VuuRpcRequest,
  VuuTable,
  VuuTableMeta,
} from "@finos/vuu-protocol-types";
import { VuuUIMessageOut } from "./vuuUIMessageTypes";

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

export type ViewportRowMap = { [key: string]: VuuRow[] };
export const groupRowsByViewport = (rows: VuuRow[]): ViewportRowMap => {
  const result: ViewportRowMap = {};
  for (const row of rows) {
    const rowsForViewport =
      result[row.viewPortId] || (result[row.viewPortId] = []);
    rowsForViewport.push(row);
  }
  return result;
};

export type SchemaColumn = {
  name: string;
  serverDataType: VuuColumnDataType;
};

export interface VuuTableMetaWithTable extends VuuTableMeta {
  table: VuuTable;
}

export type TableSchema = {
  columns: SchemaColumn[];
  key: string;
  table: VuuTable;
};

export const createSchemaFromTableMetadata = ({
  columns,
  dataTypes,
  key,
  table,
}: VuuTableMetaWithTable): Readonly<TableSchema> => {
  return {
    table,
    columns: columns.map((col, idx) => ({
      name: col,
      serverDataType: dataTypes[idx],
    })),
    key,
  };
};
