import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { buildColumnMap } from "@finos/vuu-utils/src";
import {
  InstrumentPricesColumnMap,
  InstrumentPricesReferenceData,
} from "../reference-data";
import { BaseUpdateGenerator } from "../UpdateGenerator";
import { schemas } from "../useSchemas";
import { ColumnGenerator, RowGenerator } from "./vuu-row-generator";

const { instrumentPrices: instrumentPriceSchema } = schemas;

export const InstrumentPricesRowGenerator: RowGenerator =
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

export const createInstrumentPriceUpdateGenerator = () =>
  new BaseUpdateGenerator([bid, bidSize, ask, askSize]);

export const InstrumentPricesColumnGenerator: ColumnGenerator = (
  columns = []
  //columnConfig: ExtendedColumnConfig = {}
) => {
  const instrumentPriceColumns: ColumnDescriptor[] =
    schemas.instrumentPrices.columns;
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
