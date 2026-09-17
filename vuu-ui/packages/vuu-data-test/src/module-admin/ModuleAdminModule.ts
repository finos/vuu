import {
  DEFAULT_MODULE_DEFINITIONS,
  type ModuleAccessRole,
} from "@heswell/module-admin/contracts";
import type { TableSchema } from "@vuu-ui/vuu-data-types";
import { VuuModule } from "../core/module/VuuModule";
import tableContainer from "../core/table/TableContainer";
import { buildDataColumnMapFromSchema, type Table } from "../Table";
import {
  MODULE_ADMIN_MODULE_NAME,
  MODULE_ADMIN_TABLE_SCHEMAS,
  type ModuleAdminTableName,
} from "./module-admin-schemas";
import {
  reconcileModuleAdminTables,
  type ModuleAdminSnapshot,
} from "./snapshot-projection";

type ModuleAdminTables = Record<ModuleAdminTableName, Table>;

const createTable = (tableName: ModuleAdminTableName) => {
  const schema = MODULE_ADMIN_TABLE_SCHEMAS[tableName] satisfies TableSchema;
  return tableContainer.createTable(
    schema,
    [],
    buildDataColumnMapFromSchema(schema),
  );
};

const createTables = (): ModuleAdminTables => ({
  modulePermissions: createTable("modulePermissions"),
  modules: createTable("modules"),
});

export const MODULE_ADMIN_INITIAL_SNAPSHOT: ModuleAdminSnapshot = {
  moduleAccessRoles: [
    { moduleName: "moduleAdmin", role: "module-admin-access" },
    { moduleName: "userAdmin", role: "user-admin-access" },
    { moduleName: "basket-trading", role: "basket-trading-access" },
  ] satisfies readonly ModuleAccessRole[],
  modules: DEFAULT_MODULE_DEFINITIONS,
  timestamp: 1_710_000_000_000,
};

export class ModuleAdminModule extends VuuModule<ModuleAdminTableName> {
  #tables: ModuleAdminTables;

  constructor(snapshot: ModuleAdminSnapshot = MODULE_ADMIN_INITIAL_SNAPSHOT) {
    super(MODULE_ADMIN_MODULE_NAME);
    this.#tables = createTables();
    reconcileModuleAdminTables(snapshot, this.#tables);
  }

  get menus() {
    return {
      modulePermissions: undefined,
      modules: undefined,
    };
  }

  protected get includeDefaultServices() {
    return false;
  }

  get menuServices() {
    return undefined;
  }

  get schemas(): Record<ModuleAdminTableName, Readonly<TableSchema>> {
    return MODULE_ADMIN_TABLE_SCHEMAS;
  }

  get services() {
    return undefined;
  }

  get tables() {
    return this.#tables;
  }

  get visualLinks() {
    return undefined;
  }
}

export const moduleAdminModule = new ModuleAdminModule();
