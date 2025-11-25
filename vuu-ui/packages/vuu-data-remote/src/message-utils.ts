import { TableSchema, WithRequestId } from "@vuu-ui/vuu-data-types";
import { VuuTableMetaResponse, VuuRow } from "@vuu-ui/vuu-protocol-types";

export const hasRequestId = <T extends object>(
  message: T,
): message is WithRequestId<T> => {
  return "requestId" in message;
};

export const stripRequestId = <T>({
  requestId,
  ...rest
}: WithRequestId<T>): [string, T] => [requestId, rest as T];

export const getFirstAndLastRows = (
  rows: VuuRow[],
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

const insertRow = (rows: VuuRow[], row: VuuRow) => {
  const lastRow = rows.at(-1);
  if (lastRow === undefined || row.rowIndex > lastRow.rowIndex) {
    rows.push(row);
  } else {
    for (let i = 0; i < rows.length; i++) {
      if (row.rowIndex < rows[i].rowIndex) {
        rows.splice(i, 0, row);
        return;
      } else if (row.rowIndex === rows[i].rowIndex) {
        if (row.ts < rows[i].ts) {
          // ignore an earlier update
        } else {
          rows[i] = row;
        }
        return;
      }
    }
    throw Error("don't expect to get this far");
  }
};

export const groupRowsByViewport = (rows: VuuRow[]): ViewportRowMap => {
  const result: ViewportRowMap = {};
  for (const row of rows) {
    const rowsForViewport =
      result[row.viewPortId] || (result[row.viewPortId] = []);
    insertRow(rowsForViewport, row);
  }
  return result;
};

export const createSchemaFromTableMetadata = ({
  columns,
  dataTypes,
  key,
  table,
}: Omit<VuuTableMetaResponse, "type">): Readonly<TableSchema> => {
  return {
    table,
    columns: columns.map((col, idx) => ({
      name: col,
      serverDataType: dataTypes[idx],
    })),
    key,
  };
};

/**
 * This is called when we have row updates to process and
 * we have rows in local cache to fill client range.
 * We check here to see if there is any gap between this
 * set of updates and the last set of rows sent to client.
 * If so, it indicates that we have previously received
 * updates but that we did not have all ther rows needed
 * to satisfy client range request, so they were not sent
 * to client. Now we can send them all.
 */
// export const gapBetweenLastRowSentToClient = (
//   lastRowsReturnedToClient: [number, number],
//   pendingUpdates: VuuRow[],
//   clientRange: VuuRange,
//   rowCount: number,
// ): VuuRange | undefined => {
//   const firstPendingUpdate = pendingUpdates.at(0);
//   const lastPendingUpdate = pendingUpdates.at(-1);

//   if (firstPendingUpdate && lastPendingUpdate) {
//     const maxTo = Math.min(rowCount, clientRange.to);

//     const [firstRowIndex, lastRowIndex] = lastRowsReturnedToClient;
//     if (
//       lastRowIndex < firstPendingUpdate.rowIndex - 1 &&
//       clientRange.from < firstPendingUpdate.rowIndex
//     ) {
//       return {
//         from: Math.max(lastRowIndex + 1, clientRange.from),
//         to: firstPendingUpdate.rowIndex,
//       };
//     } else if (
//       firstRowIndex > lastPendingUpdate.rowIndex + 1 &&
//       maxTo > lastPendingUpdate.rowIndex
//     ) {
//       return {
//         from: lastPendingUpdate.rowIndex + 1,
//         to: Math.min(maxTo, firstRowIndex),
//       };
//     } else if (firstRowIndex === -1 && lastRowIndex === -1) {
//       if (clientRange.from < firstPendingUpdate.rowIndex) {
//         return {
//           from: clientRange.from,
//           to: firstPendingUpdate.rowIndex,
//         };
//       } else if (maxTo > lastPendingUpdate.rowIndex + 1) {
//         return {
//           from: lastPendingUpdate.rowIndex + 1,
//           to: maxTo,
//         };
//       }
//     }
//   }
// };
