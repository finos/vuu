import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { VuuRowDataItemType, VuuTable } from "@finos/vuu-protocol-types";
import { RowAtIndexFunc } from "../ArrayProxy";
import * as dataGenerators from ".";
import { UpdateGenerator } from "../rowUpdates";

export const VuuColumnGenerator = (columnCount: number): string[] =>
  ["Row No"].concat(
    Array(columnCount)
      .fill("")
      .map((_, i) => `Column ${i + 1}`)
  );

export type RowGeneratorFactory<T = VuuRowDataItemType> = (
  columns: string[]
) => RowAtIndexFunc<T[]>;

export type ColumnGeneratorFn = (
  columns?: number | string[],
  columnConfig?: { [key: string]: Partial<ColumnDescriptor> }
) => ColumnDescriptor[];

export const DefaultRowGenerator: RowGeneratorFactory<string> =
  (columns: string[]) => (index) => {
    return [`row ${index + 1}`].concat(
      Array(columns.length)
        .fill(true)
        .map((v, j) => `value ${j + 1} @ ${index + 1}`)
    );
  };

export const DefaultColumnGenerator: ColumnGeneratorFn = (
  columns,
  columnConfig = {}
) => {
  if (typeof columns === "number") {
    return [{ name: "row number", width: 150 }].concat(
      Array(columns)
        .fill(true)
        .map((_, i) => {
          const name = `column ${i + 1}`;
          return { name, width: 100, ...columnConfig[name] };
        })
    );
  } else {
    throw Error("DefaultColumnGenerator must be passed columns (number)");
  }
};

const defaultGenerators = {
  ColumnGenerator: DefaultColumnGenerator,
  RowGeneratorFactory: DefaultRowGenerator,
};

export const getColumnAndRowGenerator = (
  table?: VuuTable
):
  | [ColumnGeneratorFn, RowGeneratorFactory]
  | [ColumnGeneratorFn, RowGeneratorFactory, () => UpdateGenerator] => {
  const tableName = table?.table ?? "";
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (table?.table && dataGenerators[table?.table] === undefined) {
    throw Error(
      `vuu-row-gererator table ${table.table} was requested but no generator is registered`
    );
  }
  const { ColumnGenerator, RowGenerator, createUpdateGenerator } =
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    dataGenerators[tableName] ?? defaultGenerators;
  return [ColumnGenerator, RowGenerator, createUpdateGenerator];
};

export const populateArray = (
  count: number,
  colGen: ColumnGeneratorFn,
  rowGen: RowGeneratorFactory,
  columns?: number | string[]
) => {
  const columnDescriptors = colGen(columns);
  const generateRow = rowGen(columnDescriptors.map((col) => col.name));
  const data: Array<VuuRowDataItemType[]> = [];
  for (let i = 0; i < count; i++) {
    data[i] = generateRow(i) as VuuRowDataItemType[];
  }
  return data;
};
