import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { buildColumnMap } from "@finos/vuu-utils";
import { PriceReferenceData } from "../reference-data";
import { schemas } from "../useSchemas";
import { ExtendedColumnConfig } from "../useTableConfig";
import { ColumnGenerator, RowGenerator } from "./vuu-row-generator";
import { BaseUpdateGenerator } from "../UpdateGenerator";

export const PricesRowGenerator: RowGenerator = () => (index: number) => {
  if (index >= PriceReferenceData.length) {
    throw Error("generateRow index val is too high");
  }

  return PriceReferenceData[index];
};

const { prices: pricesSchema } = schemas;
const { bid, bidSize, ask, askSize } = buildColumnMap(pricesSchema.columns);
const tickingColumns = [bid, bidSize, ask, askSize];
export const createPriceUpdateGenerator = () =>
  new BaseUpdateGenerator(tickingColumns);

export const PricesColumnGenerator: ColumnGenerator = (
  columns = [],
  columnConfig: ExtendedColumnConfig = {}
) => {
  console.log({ columnConfig });
  const schemaColumns: ColumnDescriptor[] = pricesSchema.columns;
  if (typeof columns === "number") {
    throw Error("PricesColumnGenerator must be passed columns (strings)");
  } else if (columns.length === 0) {
    return schemaColumns;
  } else {
    // TODO return just requested columns and apply extended config
    return schemaColumns;
  }
};
