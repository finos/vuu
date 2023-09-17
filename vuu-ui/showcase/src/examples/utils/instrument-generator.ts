import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { ColumnGenerator, RowGenerator } from "./vuu-row-generator";
import { schemas } from "./useSchemas";
import { InstrumentReferenceData } from "./reference-data";

import "./reference-data";

export const InstrumentRowGenerator: RowGenerator = () => (index: number) => {
  if (index >= InstrumentReferenceData.length) {
    throw Error("generateRow index val is too high");
  }
  return InstrumentReferenceData[index].slice(0, 7);
};

export const InstrumentColumnGenerator: ColumnGenerator = (
  columns = []
  // columnConfig: ExtendedColumnConfig = {}
) => {
  const instrumentColumns: ColumnDescriptor[] = schemas.instruments.columns;
  if (typeof columns === "number") {
    throw Error("InstrumentColumnGenerator must be passed columns (strings)");
  } else if (columns.length === 0) {
    return instrumentColumns;
  } else {
    // TODO return just erquested columns and apply extended config
    return instrumentColumns;
  }
};
