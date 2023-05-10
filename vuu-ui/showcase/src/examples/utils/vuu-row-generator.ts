import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { VuuRowDataItemType, VuuTable } from "@finos/vuu-protocol-types";
import { RowAtIndexFunc } from "./ArrayProxy";

export const VuuColumnGenerator = (columnCount: number): string[] =>
  ["Row No"].concat(
    Array(columnCount)
      .fill("")
      .map((_, i) => `Column ${i + 1}`)
  );

export type RowGenerator = (
  columns: number | string[]
) => RowAtIndexFunc<VuuRowDataItemType[]>;

export type ColumnGenerator = (
  columns: number | string[],
  columnConfig?: { [key: string]: Partial<ColumnDescriptor> }
) => ColumnDescriptor[];

export const DefaultRowGenerator: RowGenerator = (columns) => (index) => {
  if (typeof columns === "number") {
    return [`row ${index + 1}`].concat(
      Array(columns)
        .fill(true)
        .map((v, j) => `value ${j + 1} @ ${index + 1}`)
    );
  } else {
    throw Error("DefaultRowGenerator must be passed columns (number)");
  }
};

export const DefaultColumnGenerator: ColumnGenerator = (
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

export const InstrumentRowGenerator: RowGenerator = (columns) => (index) => {
  if (typeof columns === "number") {
    return [`row ${index + 1}`].concat(
      Array(columns)
        .fill(true)
        .map((v, j) => `value ${j + 1} @ ${index + 1}`)
    );
  } else {
    throw Error("DefaultRowGenerator must be passed columns (number)");
  }
};

export const InstrumentColumnGenerator: ColumnGenerator = (
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

export const getRowGenerator = (table?: VuuTable): RowGenerator => {
  if (table?.table === "instruments") {
    return InstrumentRowGenerator;
  }
  return DefaultRowGenerator;
};

export const getColumnAndRowGenerator = (
  table?: VuuTable
  // columns?: string[]
): [ColumnGenerator, RowGenerator] => {
  if (table?.table === "instruments") {
    return [InstrumentColumnGenerator, InstrumentRowGenerator];
  }

  return [DefaultColumnGenerator, DefaultRowGenerator];
};
