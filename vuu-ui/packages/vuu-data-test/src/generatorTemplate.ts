import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { ColumnMap } from "@finos/vuu-utils";
import { VuuDataRow } from "@finos/vuu-protocol-types";
import { ColumnGeneratorFn, RowGeneratorFactory } from "./vuu-row-generator";
import { getSchema, VuuTableName } from "./schemas";

export const getGenerators = (
  tableName: VuuTableName,
  columnMap: ColumnMap,
  data: VuuDataRow[]
): [RowGeneratorFactory, ColumnGeneratorFn] => [
  (columnNames?: string[]) => (index: number) => {
    if (index >= data.length) {
      return undefined;
    }
    if (columnNames) {
      return columnNames.map((name) => data[index][columnMap[name]]);
    } else {
      return data[index].slice(0, 7);
    }
  },

  (
    columns = []
    //columnConfig: ExtendedColumnConfig = {}
  ) => {
    const schema = getSchema(tableName);
    const result: ColumnDescriptor[] = schema.columns;
    if (typeof columns === "number") {
      throw Error(`${tableName}Generator must be passed columns (strings)`);
    } else if (columns.length === 0) {
      return result;
    } else {
      return columns.map<ColumnDescriptor>((name) => {
        const column = result.find((col) => col.name === name);
        if (column) {
          return column;
        } else {
          throw Error(`${tableName}Generator no column ${name}`);
        }
      });
    }
  },
];
