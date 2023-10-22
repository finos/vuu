import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { ColumnGeneratorFn, RowGeneratorFactory } from "./vuu-row-generator";
import { getSchema } from "@finos/vuu-data-test";
import {
  BasketOrdersReferenceData,
  BasketOrdersColumnMap,
} from "../reference-data";

export const RowGenerator: RowGeneratorFactory =
  (columnNames?: string[]) => (index: number) => {
    if (index >= BasketOrdersReferenceData.length) {
      throw Error("generateRow index val is too high");
    }
    if (columnNames) {
      return columnNames.map(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        (name) => BasketOrdersReferenceData[index][BasketOrdersColumnMap[name]]
      );
    } else {
      return BasketOrdersReferenceData[index].slice(0, 7);
    }
  };

export const ColumnGenerator: ColumnGeneratorFn = (
  columns = []
  //columnConfig: ExtendedColumnConfig = {}
) => {
  const schema = getSchema("basketOrders");
  const basketOrdersColumns: ColumnDescriptor[] = schema.columns;
  if (typeof columns === "number") {
    throw Error("basketOrdersColumnGenerator must be passed columns (strings)");
  } else if (columns.length === 0) {
    return basketOrdersColumns;
  } else {
    return columns.map<ColumnDescriptor>((name) => {
      const column = basketOrdersColumns.find((col) => col.name === name);
      if (column) {
        return column;
      } else {
        throw Error(`basketOrdersColumnGenerator no column ${name}`);
      }
    });
  }
};
