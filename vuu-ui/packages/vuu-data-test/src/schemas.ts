import type { TableSchema } from "@vuu-ui/vuu-data-types";
import {
  type BasketsTableName,
  schemas as basketSchemas,
} from "./basket/basket-schemas";
import {
  type SimulTableName,
  schemas as simulSchemas,
} from "./simul/simul-schemas";
import { type TestTableName, testModule } from "./test/TestModule";
import {
  USER_ADMIN_TABLE_SCHEMAS,
  type UserAdminTableName,
} from "@heswell/user-admin/contracts";
import {
  MODULE_ADMIN_TABLE_SCHEMAS,
  type ModuleAdminTableName,
} from "./module-admin";

export type VuuTableName =
  | BasketsTableName
  | SimulTableName
  | TestTableName
  | UserAdminTableName
  | ModuleAdminTableName;
export const schemas: Record<VuuTableName, TableSchema> = {
  ...basketSchemas,
  ...simulSchemas,
  ...testModule.schemas,
  ...USER_ADMIN_TABLE_SCHEMAS,
  ...MODULE_ADMIN_TABLE_SCHEMAS,
};

const allSchemas: Readonly<Record<VuuTableName, Readonly<TableSchema>>> = {
  ...basketSchemas,
  ...simulSchemas,
  ...testModule.schemas,
  ...USER_ADMIN_TABLE_SCHEMAS,
  ...MODULE_ADMIN_TABLE_SCHEMAS,
};

export const getAllSchemas = () => schemas;

export const getSchema = (tableName: VuuTableName) => {
  if (allSchemas[tableName]) {
    return allSchemas[tableName];
  }
  throw Error(`getSchema no schema for table ${tableName}`);
};
