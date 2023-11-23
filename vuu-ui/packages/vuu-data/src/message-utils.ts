import {
  ClientToServerMenuRPC,
  ClientToServerViewportRpcCall,
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

export const isVuuRpcRequest = (
  message:
    | VuuUIMessageOut
    | VuuRpcRequest
    | ClientToServerMenuRPC
    | ClientToServerViewportRpcCall
): message is ClientToServerViewportRpcCall =>
  message["type"] === "VIEW_PORT_RPC_CALL";

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

// Sort TableScheas by module
export const byModule = (schema1: TableSchema, schema2: TableSchema) => {
  const m1 = schema1.table.module.toLowerCase();
  const m2 = schema2.table.module.toLowerCase();
  if (m1 < m2) {
    return -1;
  } else if (m1 > m2) {
    return 1;
  } else if (schema1.table.table < schema2.table.table) {
    return -1;
  } else if (schema1.table.table > schema2.table.table) {
    return 1;
  } else {
    return 0;
  }
};

export const getColumnByName = (
  schema: TableSchema,
  name?: string
): SchemaColumn | undefined => {
  if (name === undefined) {
    return undefined;
  } else {
    const column = schema.columns.find((col) => col.name === name);
    if (column) {
      return column;
    } else {
      throw Error(
        `getColumnByName no column '${name}' in schema for ${schema.table.table}`
      );
    }
  }
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
