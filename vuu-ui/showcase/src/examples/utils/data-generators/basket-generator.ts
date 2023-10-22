import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { BasketColumnMap, BasketReferenceData } from "../reference-data";
import { getSchema } from "@finos/vuu-data-test";
import { ColumnGeneratorFn, RowGeneratorFactory } from "./vuu-row-generator";

export const RowGenerator: RowGeneratorFactory =
  (columnNames?: string[]) => (index: number) => {
    if (index >= BasketReferenceData.length) {
      throw Error("generateRow index val is too high");
    }
    if (columnNames) {
      return columnNames.map(
        (name) =>
          BasketReferenceData[index][
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            BasketColumnMap[name]
          ]
      );
    } else {
      return BasketReferenceData[index].slice(0, 7);
    }
  };

export const ColumnGenerator: ColumnGeneratorFn = (
  columns = []
  //columnConfig: ExtendedColumnConfig = {}
) => {
  const schema = getSchema("basket");
  const basketColumns: ColumnDescriptor[] = schema.columns;
  if (typeof columns === "number") {
    throw Error("BasketColumnGenerator must be passed columns (strings)");
  } else if (columns.length === 0) {
    return basketColumns;
  } else {
    return columns.map<ColumnDescriptor>((name) => {
      const column = basketColumns.find((col) => col.name === name);
      if (column) {
        return column;
      } else {
        throw Error(`BasketColumnGenerator no column ${name}`);
      }
    });
  }
};
