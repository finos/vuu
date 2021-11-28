import { metadataKeys } from '@vuu-ui/utils';

export const rowsFromColumns = (data, columns, groupColumns, pivotColumns, idx) => {
  const { count: metadataOffset, DEPTH, COUNT } = metadataKeys;
  let rowIdx = idx;
  const dataColumns = Object.keys(data);
  const count = data[dataColumns[0]].length;
  const results = Array(count);
  for (let i = 0; i < count; i++) {
    results[i] = [rowIdx + i, 0, 0, rowIdx + i];
    for (let j = 0; j < columns.length; j++) {
      const columnName = columns[j];
      if (data[columnName]) {
        results[i][metadataOffset + j] = data[columnName][i];
      }
    }
    if (data.__ROW_PATH__) {
      const path = data.__ROW_PATH__[i];
      if (path.length) {
        results[i][DEPTH] = groupColumns.length - path.length + 1;
        for (let k = 0; k < path.length; k++) {
          const colName = groupColumns[k];
          if (data[colName]) {
            const colIdx = columns.indexOf(colName);
            results[i][metadataOffset + colIdx] = path[k];
            results[i][COUNT] = data[colName][i];
          }
        }
      }
    }
  }
  return results;
};

export const convertFromPSPSchema = (schema) =>
  Object.entries(schema).map(([name, type]) => ({
    name,
    type: fromPerspectiveType(type)
  }));

export const convertToPSPSchema = (columns) =>
  columns.reduce((map, column) => {
    map[column.name] = toPerspectiveType(column.type);
    return map;
  }, {});

const FromPerspectiveType = {
  float: 'number'
};
const ToPerspectiveType = Object.entries(FromPerspectiveType).reduce(
  (m, [t1, t2]) => ((m[t2] = t1), m),
  {}
);

const fromPerspectiveType = (type) => FromPerspectiveType[type] || type || 'string';
const toPerspectiveType = (type) => ToPerspectiveType[type] || type || 'string';
