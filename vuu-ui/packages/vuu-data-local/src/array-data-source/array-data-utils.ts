import type { DataSourceRow, Selection } from "@vuu-ui/vuu-data-types";
import { ColumnMap, KeySet, metadataKeys } from "@vuu-ui/vuu-utils";

const { RENDER_IDX } = metadataKeys;

export const toClientRow = (
  row: DataSourceRow,
  keys: KeySet,
  selection: Selection,
  dataIndices?: number[],
) => {
  const [rowIndex] = row;
  let clientRow;
  if (dataIndices) {
    // If client has specified a different ordering of columns from the way they are
    // ordered inn the underlying data, this is where we effect the ordering.
    const { count } = metadataKeys;
    clientRow = row
      .slice(0, count)
      .concat(dataIndices.map((idx) => row[idx])) as DataSourceRow;
  } else {
    clientRow = row.slice() as DataSourceRow;
  }
  clientRow[RENDER_IDX] = keys.keyFor(rowIndex);
  return clientRow;
};

const divergentMaps = (columnMap: ColumnMap, dataMap?: ColumnMap) => {
  if (dataMap) {
    const { count: mapOffset } = metadataKeys;
    for (const [columnName, index] of Object.entries(columnMap)) {
      const dataIdx = dataMap[columnName];
      if (dataIdx === undefined) {
        throw Error(
          `ArrayDataSource column ${columnName} is not in underlying data set`,
        );
      } else if (dataIdx !== index - mapOffset) {
        return true;
      }
    }
  }
  return false;
};

const getDataIndices = (columnMap: ColumnMap, dataMap: ColumnMap) => {
  const { count: mapOffset } = metadataKeys;
  const result: number[] = [];
  Object.entries(columnMap).forEach(([columnName]) => {
    result.push(dataMap[columnName] + mapOffset);
  });
  return result;
};

export const buildDataToClientMap = (
  columnMap: ColumnMap,
  dataMap?: ColumnMap,
): number[] | undefined => {
  if (dataMap && divergentMaps(columnMap, dataMap)) {
    return getDataIndices(columnMap, dataMap);
  }
  return undefined;
};
