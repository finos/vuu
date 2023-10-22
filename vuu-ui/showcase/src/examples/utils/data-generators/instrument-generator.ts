import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { ColumnGeneratorFn, RowGeneratorFactory } from "./vuu-row-generator";
import { getSchema } from "@finos/vuu-data-test";
import {
  InstrumentReferenceData,
  InstrumentColumnMap,
} from "../reference-data";
import { getCalculatedColumnType, isCalculatedColumn } from "@finos/vuu-utils";
import { ExtendedColumnConfig } from "../useTableConfig";

export const RowGenerator: RowGeneratorFactory =
  (columnNames?: string[]) => (index: number) => {
    if (index >= InstrumentReferenceData.length) {
      throw Error("generateRow index val is too high");
    }
    if (columnNames) {
      return columnNames.map(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        (name) => InstrumentReferenceData[index][InstrumentColumnMap[name]]
      );
    } else {
      return InstrumentReferenceData[index].slice(0, 7);
    }
  };

export const ColumnGenerator: ColumnGeneratorFn = (
  columns = [],
  columnConfig: ExtendedColumnConfig = {}
) => {
  const schema = getSchema("instruments");
  const instrumentColumns: ColumnDescriptor[] = schema.columns;
  if (typeof columns === "number") {
    throw Error("InstrumentColumnGenerator must be passed columns (strings)");
  } else if (columns.length === 0) {
    return instrumentColumns.map((column) => ({
      ...column,
      ...columnConfig[column.name],
    }));
  } else {
    return columns.map<ColumnDescriptor>((name) => {
      const column = instrumentColumns.find((col) => col.name === name);
      if (column) {
        return {
          ...column,
          ...columnConfig[column.name],
        };
      } else if (isCalculatedColumn(name)) {
        return {
          name,
          serverDataType: getCalculatedColumnType({ name }),
        } as ColumnDescriptor;
      } else {
        throw Error(`InstrumentColumnGenerator no column ${name}`);
      }
    });
  }
};
