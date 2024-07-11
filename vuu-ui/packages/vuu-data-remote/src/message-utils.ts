import {
  TableSchema,
  VuuUIMessageOut,
  WithRequestId,
} from "@finos/vuu-data-types";
import {
  ClientToServerMenuRPC,
  ClientToServerViewportRpcCall,
  ServerToClientTableMeta,
  VuuRow,
  VuuRpcRequest,
} from "@finos/vuu-protocol-types";

export const isVuuRpcRequest = (
  message:
    | VuuUIMessageOut
    | VuuRpcRequest
    | ClientToServerMenuRPC
    | ClientToServerViewportRpcCall
): message is ClientToServerViewportRpcCall =>
  message["type"] === "VIEW_PORT_RPC_CALL";

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

export const createSchemaFromTableMetadata = ({
  columns,
  dataTypes,
  key,
  table,
}: Omit<ServerToClientTableMeta, "type">): Readonly<TableSchema> => {
  return {
    table,
    columns: columns.map((col, idx) => ({
      name: col,
      serverDataType: dataTypes[idx],
    })),
    key,
  };
};
