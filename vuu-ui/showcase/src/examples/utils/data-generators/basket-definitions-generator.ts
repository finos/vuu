import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { buildColumnMap } from "@finos/vuu-utils/src";
import {
  BasketDefinitionsColumnMap,
  BasketDefinitionsReferenceData,
} from "../reference-data";
import { BaseUpdateGenerator } from "../UpdateGenerator";
import { getSchema } from "@finos/vuu-data-test";
import { ColumnGeneratorFn, RowGeneratorFactory } from "./vuu-row-generator";

export const RowGenerator: RowGeneratorFactory =
  (columnNames?: string[]) => (index: number) => {
    if (index >= BasketDefinitionsReferenceData.length) {
      throw Error("generateRow index val is too high");
    }
    if (columnNames) {
      return columnNames.map(
        (name) =>
          BasketDefinitionsReferenceData[index][
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            BasketDefinitionsColumnMap[name]
          ]
      );
    } else {
      return BasketDefinitionsReferenceData[index].slice(0, 7);
    }
  };

const basketDefinitionsSchema = getSchema("basketDefinitions");
const { exchangeRateToUSD } = buildColumnMap(basketDefinitionsSchema.columns);
const tickingColumns = [exchangeRateToUSD];

export const createUpdateGenerator = () => {
  return new BaseUpdateGenerator(tickingColumns);
};

export const ColumnGenerator: ColumnGeneratorFn = (
  columns = []
  //columnConfig: ExtendedColumnConfig = {}
) => {
  const schema = getSchema("basketDefinitions");
  const basketDefinitionsColumns: ColumnDescriptor[] = schema.columns;
  if (typeof columns === "number") {
    throw Error(
      "BasketDefinitionsColumnGenerator must be passed columns (strings)"
    );
  } else if (columns.length === 0) {
    return basketDefinitionsColumns;
  } else {
    return columns.map<ColumnDescriptor>((name) => {
      const column = basketDefinitionsColumns.find((col) => col.name === name);
      if (column) {
        return column;
      } else {
        throw Error(`InstrumentColumnGenerator no column ${name}`);
      }
    });
  }
};
