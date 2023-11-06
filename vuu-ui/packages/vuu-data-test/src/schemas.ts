import { TableSchema } from "@finos/vuu-data";
import {
  type BasketsTableName,
  schemas as basketSchemas,
} from "./basket/basket-schemas";
import {
  type SimulTableName,
  schemas as simulSchemas,
} from "./simul/simul-schemas";

export type VuuTableName = BasketsTableName | SimulTableName;
export const schemas: Record<VuuTableName, TableSchema> = {
  ...basketSchemas,
  ...simulSchemas,
};

const allSchemas: Readonly<Record<VuuTableName, Readonly<TableSchema>>> = {
  ...basketSchemas,
  ...simulSchemas,
};

export const getAllSchemas = () => schemas;

export const getSchema = (tableName: VuuTableName) => {
  if (allSchemas[tableName]) {
    return allSchemas[tableName];
  }
  throw Error(`getSchema no schema for table ${tableName}`);
};
