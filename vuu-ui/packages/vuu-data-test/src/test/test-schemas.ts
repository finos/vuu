import { TableSchema } from "@vuu-ui/vuu-data-types";
import { DefaultColumnGenerator } from "../vuu-row-generator";

export type TestTableName = "TestDates" | "TwoHundredColumns";

export const schemas: Readonly<Record<TestTableName, Readonly<TableSchema>>> = {
  TestDates: {
    columns: [
      {
        name: "id",
        serverDataType: "long",
      },
      {
        name: "tradeDate",
        serverDataType: "long",
      },
      {
        name: "settlementDate",
        serverDataType: "long",
      },
    ],
    key: "id",
    table: { module: "TEST", table: "TestDates" },
  },
  TwoHundredColumns: {
    columns: DefaultColumnGenerator(200).map((col) => ({
      ...col,
      serverDataType: "string",
    })),
    key: "column01",
    table: { module: "TEST", table: "TwoHundredColumns" },
  },
};
