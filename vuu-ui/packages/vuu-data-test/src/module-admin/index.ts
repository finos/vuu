export {
  ModuleAdminModule,
  MODULE_ADMIN_INITIAL_SNAPSHOT,
  moduleAdminModule,
} from "./ModuleAdminModule";
export {
  MODULE_ADMIN_MODULE_NAME,
  MODULE_ADMIN_TABLE_SCHEMAS,
  type ModuleAdminTableName,
} from "./module-admin-schemas";
export {
  projectModuleAdminSnapshot,
  reconcileModuleAdminTables,
  type ModuleAdminSnapshot,
} from "./snapshot-projection";
export type {
  ModuleAccessRole,
  ModuleDefinition,
  ModulePermissionRow,
  ModuleRow,
} from "@heswell/module-admin/contracts";
