import { TableSchema } from "@finos/vuu-data-types";
import { DefaultColumnGenerator } from "../vuu-row-generator";

export type TestTableName = "TwoHundredColumns";

export const schemas: Readonly<Record<TestTableName, Readonly<TableSchema>>> = {
  TwoHundredColumns: {
    columns: DefaultColumnGenerator(200).map((col) => ({
      ...col,
      serverDataType: "string",
    })),
    key: "column01",
    table: { module: "TEST", table: "TwoHundredColumns" },
  },
};
