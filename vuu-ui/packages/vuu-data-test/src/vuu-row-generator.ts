import type { ColumnDescriptor } from "@finos/vuu-table-types";
import type { VuuRowDataItemType, VuuTable } from "@finos/vuu-protocol-types";
import { UpdateGenerator } from "./rowUpdates";

type GenerateRowFunc = (index: number) => VuuRowDataItemType[];

export type RowGeneratorFactory = (columns: string[]) => GenerateRowFunc;

export type ColumnGeneratorFn = (
  columns?: number | string[],
  columnConfig?: { [key: string]: Partial<ColumnDescriptor> }
) => ColumnDescriptor[];

export const DefaultRowGenerator: RowGeneratorFactory =
  (columns: string[]) => (index) => {
    return [`row ${index + 1}`].concat(
      Array(columns.length)
        .fill(true)
        .map((v, j) => `value ${j + 2} @ ${index + 1}`)
    );
  };

export const DefaultColumnGenerator: ColumnGeneratorFn = (
  columns,
  columnConfig = {}
) => {
  if (typeof columns === "number") {
    return [{ label: "Row Number", name: "rownum", width: 150 }].concat(
      Array(columns)
        .fill(true)
        .map((_, i) => {
          const name = `column_${i + 1}`;
          const label = `Column ${i + 1}`;
          return { label, name, width: 100, ...columnConfig[name] };
        })
    );
  } else {
    throw Error("DefaultColumnGenerator must be passed columns (number)");
  }
};

export const defaultGenerators = {
  ColumnGenerator: DefaultColumnGenerator,
  RowGenerator: DefaultRowGenerator,
};

export const getColumnAndRowGenerator = (
  table?: VuuTable
):
  | [ColumnGeneratorFn, RowGeneratorFactory]
  | [ColumnGeneratorFn, RowGeneratorFactory, () => UpdateGenerator] => {
  const tableName = table?.table ?? "";
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  switch (table?.module) {
    case "SIMUL": {
      const { ColumnGenerator, RowGenerator, createUpdateGenerator } =
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        simulDataGenerators[tableName] ?? defaultGenerators;
      return [ColumnGenerator, RowGenerator, createUpdateGenerator];
    }

    case "BASKET": {
      const { ColumnGenerator, RowGenerator, createUpdateGenerator } =
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        basketDataGenerators[tableName] ?? defaultGenerators;
      return [ColumnGenerator, RowGenerator, createUpdateGenerator];
    }
    case undefined: {
      const { ColumnGenerator, RowGenerator } = defaultGenerators;
      return [ColumnGenerator, RowGenerator];
    }
    default:
      throw Error(
        `vuu-row-gererator table ${table?.table} was requested but no generator is registered`
      );
  }
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
    const row = generateRow(i);
    if (row) {
      data[i] = row;
    } else {
      break;
    }
  }
  return data;
};
