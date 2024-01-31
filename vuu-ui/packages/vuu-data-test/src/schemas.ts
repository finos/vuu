import { TableSchema } from "@finos/vuu-data-types";
import {
  type BasketsTableName,
  schemas as basketSchemas,
} from "./basket/basket-schemas";
import {
  type SimulTableName,
  schemas as simulSchemas,
} from "./simul/simul-schemas";
import {
  type TestTableName,
  schemas as testSchemas,
} from "./test/test-schemas";

export type VuuTableName = BasketsTableName | SimulTableName | TestTableName;
export const schemas: Record<VuuTableName, TableSchema> = {
  ...basketSchemas,
  ...simulSchemas,
  ...testSchemas,
};

const allSchemas: Readonly<Record<VuuTableName, Readonly<TableSchema>>> = {
  ...basketSchemas,
  ...simulSchemas,
  ...testSchemas,
};

export const getAllSchemas = () => schemas;

export const getSchema = (tableName: VuuTableName) => {
  if (allSchemas[tableName]) {
    return allSchemas[tableName];
  }
  throw Error(`getSchema no schema for table ${tableName}`);
};
