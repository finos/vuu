import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { buildColumnMap } from "@finos/vuu-utils/src";
import {
  BasketDefinitionsColumnMap,
  BasketDefinitionsReferenceData,
} from "../reference-data";
import { BaseUpdateGenerator } from "../UpdateGenerator";
import { schemas } from "../useSchemas";
import { ColumnGenerator, RowGenerator } from "./vuu-row-generator";

export const BasketDefinitionsRowGenerator: RowGenerator =
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

const { basketDefinitions: basketDefinitionsSchema } = schemas;
const { exchangeRateToUSD } = buildColumnMap(basketDefinitionsSchema.columns);
const tickingColumns = [exchangeRateToUSD];
export const createBasketDefinitionsUpdateGenerator = () => {
  return new BaseUpdateGenerator(tickingColumns);
};

export const BasketDefinitionsColumnGenerator: ColumnGenerator = (
  columns = []
  //columnConfig: ExtendedColumnConfig = {}
) => {
  const basketDefinitionsColumns: ColumnDescriptor[] =
    schemas.basketDefinitions.columns;
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
