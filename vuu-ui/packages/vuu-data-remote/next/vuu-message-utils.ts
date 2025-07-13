import { VuuDataRow, VuuRow } from "@vuu-ui/vuu-protocol-types";

export const separateSizeFromDataRows = (
  rows: VuuRow<VuuDataRow>[],
): [VuuRow<VuuDataRow> | undefined, VuuRow<VuuDataRow>[] | undefined] => {
  let sizeRow: VuuRow<VuuDataRow> | undefined = undefined;
  let dataRows: VuuRow<VuuDataRow>[] | undefined = undefined;

  for (const row of rows) {
    if (row.updateType === "SIZE") {
      // If we have multiple SIZE rows, last one wins. We might need to check
      // timeStamp in case the rows are not in ts order
      sizeRow = row;
    } else {
      if (dataRows === undefined) {
        dataRows = [];
      }
      dataRows.push(row);
    }
  }

  return [sizeRow, dataRows];
};
