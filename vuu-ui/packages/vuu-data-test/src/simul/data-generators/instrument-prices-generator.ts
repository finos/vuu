import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { buildColumnMap } from "@finos/vuu-utils/src";
import {
  InstrumentPricesColumnMap,
  InstrumentPricesReferenceData,
} from "../reference-data";
import { BaseUpdateGenerator } from "../../UpdateGenerator";
import { getSchema } from "../../index";
import {
  ColumnGeneratorFn,
  RowGeneratorFactory,
} from "../../vuu-row-generator";

const instrumentPriceSchema = getSchema("instrumentPrices");

export const RowGenerator: RowGeneratorFactory =
  (columnNames?: string[]) => (index: number) => {
    if (index >= InstrumentPricesReferenceData.length) {
      throw Error("generateRow index val is too high");
    }
    if (columnNames) {
      return columnNames.map(
        (name) =>
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          InstrumentPricesReferenceData[index][InstrumentPricesColumnMap[name]]
      );
    } else {
      return InstrumentPricesReferenceData[index].slice(0, 7);
    }
  };

const { bid, bidSize, ask, askSize } = buildColumnMap(
  instrumentPriceSchema.columns
);

export const createUpdateGenerator = () =>
  new BaseUpdateGenerator([bid, bidSize, ask, askSize]);

export const ColumnGenerator: ColumnGeneratorFn = (
  columns = []
  //columnConfig: ExtendedColumnConfig = {}
) => {
  const instrumentPriceColumns: ColumnDescriptor[] =
    instrumentPriceSchema.columns;
  if (typeof columns === "number") {
    throw Error(
      "InstrumentPricesColumnGenerator must be passed columns (strings)"
    );
  } else if (columns.length === 0) {
    return instrumentPriceColumns;
  } else {
    return columns.map<ColumnDescriptor>((name) => {
      const column = instrumentPriceColumns.find((col) => col.name === name);
      if (column) {
        return column;
      } else {
        throw Error(`InstrumentPricesColumnGenerator no column ${name}`);
      }
    });
  }
};
