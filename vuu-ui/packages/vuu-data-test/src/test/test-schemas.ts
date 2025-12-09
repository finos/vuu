import { TableSchema } from "@vuu-ui/vuu-data-types";
import { DefaultColumnGenerator } from "../vuu-row-generator";

export type TestTableName =
  | "TestDates"
  | "TwoHundredColumns"
  | "LinkParent"
  | "LinkChild";

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
    key: "column_1",
    table: { module: "TEST", table: "TwoHundredColumns" },
  },
  LinkParent: {
    columns: [
      { name: "id", serverDataType: "string" },
      { name: "data", serverDataType: "string" },
    ],
    key: "id",
    table: { module: "TEST", table: "LinkParent" },
  },

  LinkChild: {
    columns: [
      { name: "id", serverDataType: "string" },
      { name: "parentId", serverDataType: "string" },
      { name: "data", serverDataType: "string" },
    ],
    key: "id",
    table: { module: "TEST", table: "LinkChild" },
  },
};
