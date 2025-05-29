import { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";

export type DataRowAtIndexFunc<T = unknown> = (index: number) => T[];

type RowGenerator<T = VuuRowDataItemType> = (
  columns: string[],
) => DataRowAtIndexFunc<T>;

export type ColumnGenerator = (count: number) => ColumnDescriptor[];

export const columnGenerator: ColumnGenerator = (count) => {
  return [{ name: "row number", width: 150 }].concat(
    Array(count)
      .fill(true)
      .map((_, i) => {
        const name = `column ${i + 1}`;
        return { name, width: 150 };
      }),
  );
};

export const rowGenerator: RowGenerator<VuuRowDataItemType> =
  (columns: string[]) => (index) => {
    const rowIndex = index + 1;
    return [`row ${rowIndex.toLocaleString()}`].concat(
      Array(columns.length)
        .fill(true)
        .map((v, j) => `value ${j + 1} @ ${index + 1}`),
    );
  };
