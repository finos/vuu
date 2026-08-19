import {
  DEFAULT_MODULE_DEFINITIONS,
  moduleDefinitionsToRows,
  modulePermissionsFor,
} from "@heswell/module-admin/contracts";
import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import moduleContainer from "../src/core/module/ModuleContainer";
import {
  ModuleAdminModule,
  MODULE_ADMIN_INITIAL_SNAPSHOT,
} from "../src/module-admin/ModuleAdminModule";
import {
  MODULE_ADMIN_MODULE_NAME,
  MODULE_ADMIN_TABLE_SCHEMAS,
} from "../src/module-admin/module-admin-schemas";
import { reconcileModuleAdminTables } from "../src/module-admin/snapshot-projection";
import type { TickingArrayDataSource } from "../src/TickingArrayDataSource";
import { Range } from "@vuu-ui/vuu-utils";

const createModule = () =>
  new ModuleAdminModule(structuredClone(MODULE_ADMIN_INITIAL_SNAPSHOT));

const dataSource = (
  module: ModuleAdminModule,
  table: keyof typeof MODULE_ADMIN_TABLE_SCHEMAS = "modules",
) =>
  module.createDataSource(table, `module-admin-${table}`, {
    columns: MODULE_ADMIN_TABLE_SCHEMAS[table].columns.map(({ name }) => name),
  }) as TickingArrayDataSource;

describe("ModuleAdminModule", () => {
  it("registers MODULE_DISCOVERY with the exact module-admin tables", () => {
    const module = createModule();

    expect(module.name).toBe(MODULE_ADMIN_MODULE_NAME);
    expect(moduleContainer.get(MODULE_ADMIN_MODULE_NAME)).toBe(module);
    expect(module.getTableList().sort()).toEqual([
      "modulePermissions",
      "modules",
    ]);
    expect(MODULE_ADMIN_TABLE_SCHEMAS.modules.table).toEqual({
      module: "MODULE_DISCOVERY",
      table: "modules",
    });
    expect(MODULE_ADMIN_TABLE_SCHEMAS.modulePermissions.table).toEqual({
      module: "MODULE_DISCOVERY",
      table: "modulePermissions",
    });
    expect(MODULE_ADMIN_TABLE_SCHEMAS.modules.columns).toEqual([
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
      { name: "vuuCreatedTimestamp", serverDataType: "epochtimestamp" },
      { name: "vuuUpdatedTimestamp", serverDataType: "epochtimestamp" },
      { name: "vuuMsg", serverDataType: "string" },
    ]);
    expect(MODULE_ADMIN_TABLE_SCHEMAS.modulePermissions.columns).toEqual([
      { name: "id", serverDataType: "int" },
      { name: "module_id", serverDataType: "int" },
      { name: "role", serverDataType: "string" },
      { name: "vuuCreatedTimestamp", serverDataType: "epochtimestamp" },
      { name: "vuuUpdatedTimestamp", serverDataType: "epochtimestamp" },
      { name: "vuuMsg", serverDataType: "string" },
    ]);
  });

  it("projects deterministic contract catalog and permissions data", () => {
    const module = createModule();

    expect(
      module.tables.modules.data.map(
        (row) => row[module.tables.modules.map.id],
      ),
    ).toEqual([1, 2, 3]);
    expect(
      module.tables.modules.data.map(
        (row) => row[module.tables.modules.map.name],
      ),
    ).toEqual(["moduleAdmin", "userAdmin", "basket-trading"]);
    expect(
      module.tables.modulePermissions.data.map((row) => [
        row[module.tables.modulePermissions.map.module_id],
        row[module.tables.modulePermissions.map.role],
      ]),
    ).toEqual([
      [1, "module-admin-access"],
      [2, "user-admin-access"],
      [3, "basket-trading-access"],
    ]);
    expect(
      moduleDefinitionsToRows(DEFAULT_MODULE_DEFINITIONS).map(([id]) => id),
    ).toEqual([1, 2, 3]);
    expect(
      modulePermissionsFor(
        DEFAULT_MODULE_DEFINITIONS,
        MODULE_ADMIN_INITIAL_SNAPSHOT.moduleAccessRoles,
      ),
    ).toHaveLength(3);
  });

  it("provides live modules and permissions data sources without RPC services", async () => {
    const module = createModule();
    const source = dataSource(module);
    const permissions = dataSource(module, "modulePermissions");

    expect(source.tableSchema).toBe(MODULE_ADMIN_TABLE_SCHEMAS.modules);
    expect(permissions.tableSchema).toBe(
      MODULE_ADMIN_TABLE_SCHEMAS.modulePermissions,
    );
    await expect(
      source.rpcRequest({
        params: {},
        rpcName: "beginEditSession",
        type: "RPC_REQUEST",
      }),
    ).rejects.toThrow(
      "[TickingArrayDataSource] no service to handle RPC request beginEditSession",
    );
  });

  it("emits subscribed updates when a contract snapshot is reconciled", async () => {
    const module = createModule();
    const source = dataSource(module);
    const updates = vi.fn();
    await source.subscribe({ range: Range(0, 20) }, updates);
    updates.mockClear();

    reconcileModuleAdminTables(
      {
        ...MODULE_ADMIN_INITIAL_SNAPSHOT,
        modules: MODULE_ADMIN_INITIAL_SNAPSHOT.modules.map((definition) =>
          definition.id === 1 ? { ...definition, enabled: false } : definition,
        ),
      },
      module.tables,
    );

    expect(updates).toHaveBeenCalled();
    expect(
      module.tables.modules.findByKey("1")?.[module.tables.modules.map.enabled],
    ).toBe(false);
  });

  it("keeps the browser implementation on the contracts entry point", async () => {
    const source = await readFile(
      "packages/vuu-data-test/src/module-admin/ModuleAdminModule.ts",
      "utf8",
    );

    expect(source).toContain('from "@heswell/module-admin/contracts"');
    expect(source).not.toContain('from "@heswell/module-admin"');
    expect(source).not.toContain("vuu-portal");
  });
});
