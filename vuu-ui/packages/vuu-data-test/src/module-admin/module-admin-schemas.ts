import type { TableSchema } from "@vuu-ui/vuu-data-types";
import { VUU_DEFAULT_COLUMNS } from "../default-column-definitions";

const DEFAULT_RANGE_LIMITS = {
  maxRangeEnd: 1_000_000,
  maxRangeWidth: 1_000,
};

export const MODULE_ADMIN_MODULE_NAME = "MODULE_DISCOVERY";

export type ModuleAdminTableName = "modules" | "modulePermissions";

export const MODULE_ADMIN_TABLE_SCHEMAS: Readonly<
  Record<ModuleAdminTableName, Readonly<TableSchema>>
> = {
  modules: {
    columns: [
      { name: "id", serverDataType: "int" },
      { name: "name", serverDataType: "string" },
      { name: "title", serverDataType: "string" },
      { name: "description", serverDataType: "string" },
      { name: "version", serverDataType: "int" },
      { name: "enabled", serverDataType: "boolean" },
      { name: "location", serverDataType: "string" },
      { name: "path", serverDataType: "string" },
      { name: "mfComponent", serverDataType: "string" },
      { name: "mfScope", serverDataType: "string" },
      { name: "mfUrl", serverDataType: "string" },
      { name: "vuuConnectionId", serverDataType: "string" },
      { name: "vuuWebsocketUrl", serverDataType: "string" },
      { name: "vuuRestUrl", serverDataType: "string" },
      ...VUU_DEFAULT_COLUMNS,
    ],
    key: "id",
    rangeLimits: DEFAULT_RANGE_LIMITS,
    table: { module: MODULE_ADMIN_MODULE_NAME, table: "modules" },
  },
  modulePermissions: {
    columns: [
      { name: "id", serverDataType: "int" },
      { name: "module_id", serverDataType: "int" },
      { name: "role", serverDataType: "string" },
      ...VUU_DEFAULT_COLUMNS,
    ],
    key: "id",
    rangeLimits: DEFAULT_RANGE_LIMITS,
    table: { module: MODULE_ADMIN_MODULE_NAME, table: "modulePermissions" },
  },
};
