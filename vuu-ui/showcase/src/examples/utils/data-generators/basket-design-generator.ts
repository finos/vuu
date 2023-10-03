import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { ColumnGenerator, RowGenerator } from "./vuu-row-generator";
import { schemas } from "../useSchemas";
import {
  BasketDesignReferenceData,
  BasketDesignColumnMap,
} from "../reference-data";

export const BasketDesignRowGenerator: RowGenerator =
  (columnNames?: string[]) => (index: number) => {
    if (index >= BasketDesignReferenceData.length) {
      throw Error("generateRow index val is too high");
    }
    if (columnNames) {
      return columnNames.map(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        (name) => BasketDesignReferenceData[index][BasketDesignColumnMap[name]]
      );
    } else {
      return BasketDesignReferenceData[index].slice(0, 7);
    }
  };

export const BasketDesignColumnGenerator: ColumnGenerator = (
  columns = []
  //columnConfig: ExtendedColumnConfig = {}
) => {
  const basketDesignColumns: ColumnDescriptor[] = schemas.basketDesign.columns;
  if (typeof columns === "number") {
    throw Error("InstrumentColumnGenerator must be passed columns (strings)");
  } else if (columns.length === 0) {
    return basketDesignColumns;
  } else {
    return columns.map<ColumnDescriptor>((name) => {
      const column = basketDesignColumns.find((col) => col.name === name);
      if (column) {
        return column;
      } else {
        throw Error(`InstrumentColumnGenerator no column ${name}`);
      }
    });
  }
};
