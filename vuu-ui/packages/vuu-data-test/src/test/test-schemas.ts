import { TableSchema } from "@finos/vuu-data-types";

export type TestTableName = "TwoHundredColumns";

export const schemas: Readonly<Record<TestTableName, Readonly<TableSchema>>> = {
  TwoHundredColumns: {
    columns: Array(200)
      .fill(1)
      .map((_, i) => ({
        name: `column${`00${i}`.slice(-3)}`,
        serverDataType: "string",
      })),

    key: "column01",
    table: { module: "TEST", table: "TwoHundredColumns" },
  },
};
