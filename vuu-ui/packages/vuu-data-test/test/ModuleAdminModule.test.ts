import { MODULE_ADMIN_RPC } from "@heswell/module-admin/contracts";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
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
import type { TickingArrayDataSource } from "../src/TickingArrayDataSource";
import { Range } from "@vuu-ui/vuu-utils";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";

const NOW = 1_800_000_000_000;

const createModule = () =>
  new ModuleAdminModule(
    structuredClone(MODULE_ADMIN_INITIAL_SNAPSHOT),
    () => NOW,
  );

const dataSource = (
  module: ModuleAdminModule,
  table: keyof typeof MODULE_ADMIN_TABLE_SCHEMAS = "modules",
) =>
  module.createDataSource(table, `module-admin-${table}`, {
    columns: MODULE_ADMIN_TABLE_SCHEMAS[table].columns.map(({ name }) => name),
  }) as TickingArrayDataSource;

const rpc = (
  source: TickingArrayDataSource,
  rpcName: string,
  params: Record<string, VuuRowDataItemType>,
) => source.rpcRequest({ params, rpcName, type: "RPC_REQUEST" });

const newModule = {
  accessRole: "risk-access",
  description: "Risk views",
  enabled: true,
  location: "/Risk/Limits",
  mfComponent: "RiskLimits",
  mfScope: "riskLimits",
  mfUrl: "http://localhost:5010",
  name: "risk-limits",
  path: "/risk/limits",
  title: "Risk limits",
};

const cell = (module: ModuleAdminModule, id: number, column: string) =>
  module.tables.modules.findByKey(String(id))?.[
    module.tables.modules.map[column]
  ];

const permissionsFor = (module: ModuleAdminModule, id: number) =>
  module.tables.modulePermissions.data
    .filter((row) => row[module.tables.modulePermissions.map.module_id] === id)
    .map((row) => row[module.tables.modulePermissions.map.role]);

describe("ModuleAdminModule", () => {
  it("registers MODULE_DISCOVERY with server-aligned tables", () => {
    const module = createModule();

    expect(module.name).toBe(MODULE_ADMIN_MODULE_NAME);
    expect(moduleContainer.get(MODULE_ADMIN_MODULE_NAME)).toBe(module);
    expect(module.getTableList().sort()).toEqual([
      "modulePermissions",
      "modules",
    ]);
    expect(
      MODULE_ADMIN_TABLE_SCHEMAS.modules.columns.map(({ name }) => name),
    ).toEqual([
      "id",
      "parentModuleId",
      "name",
      "title",
      "description",
      "version",
      "enabled",
      "location",
      "path",
      "mfComponent",
      "mfScope",
      "mfUrl",
      "vuuConnectionId",
      "vuuWebsocketUrl",
      "vuuRestUrl",
      "navIconUrl",
      "vuuCreatedTimestamp",
      "vuuUpdatedTimestamp",
      "vuuMsg",
    ]);
    expect(
      MODULE_ADMIN_TABLE_SCHEMAS.modulePermissions.columns.map(
        ({ name }) => name,
      ),
    ).toEqual([
      "id",
      "module_id",
      "role",
      "vuuCreatedTimestamp",
      "vuuUpdatedTimestamp",
      "vuuMsg",
    ]);
  });

  it("seeds modules and permissions from the snapshot", () => {
    const module = createModule();
    const ids = module.tables.modules.data.map(
      (row) => row[module.tables.modules.map.id],
    );
    expect(ids).toEqual(
      MODULE_ADMIN_INITIAL_SNAPSHOT.modules.map(({ id }) => id),
    );
    expect(permissionsFor(module, 1)).toEqual(["module-admin-access"]);
    const child = MODULE_ADMIN_INITIAL_SNAPSHOT.modules.find(
      ({ parentModuleId }) => parentModuleId !== 0,
    );
    expect(child).toBeDefined();
    expect(permissionsFor(module, child!.id)).toEqual([]);
    expect(permissionsFor(module, 6)).toEqual([]);
    expect(cell(module, 6, "enabled")).toBe(false);
  });

  it("exposes the module admin RPCs on both tables", () => {
    const module = createModule();
    const names = Object.keys(MODULE_ADMIN_RPC).sort();
    expect(
      module
        .getServices("modules")
        .map(({ rpcName }) => rpcName)
        .sort(),
    ).toEqual(names);
    expect(
      module
        .getServices("modulePermissions")
        .map(({ rpcName }) => rpcName)
        .sort(),
    ).toEqual(names);
  });

  it("creates a module, allocating id and version", async () => {
    const module = createModule();
    const source = dataSource(module);
    const nextId = Math.max(...module.modules.map(({ id }) => id)) + 1;

    await expect(
      rpc(source, "createModule", { module: JSON.stringify(newModule) }),
    ).resolves.toEqual({
      data: { id: nextId, version: 1 },
      type: "SUCCESS_RESULT",
    });
    expect(cell(module, nextId, "name")).toBe("risk-limits");
    expect(permissionsFor(module, nextId)).toEqual(["risk-access"]);
  });

  it("rejects invalid modules without changing state", async () => {
    const module = createModule();
    const source = dataSource(module);
    const before = module.modules;
    const result = await rpc(source, "createModule", {
      module: JSON.stringify({ ...newModule, name: "userAdmin" }),
    });
    expect(result.type).toBe("ERROR_RESULT");
    expect(module.modules).toBe(before);
  });

  it("updates a module with optimistic versioning", async () => {
    const module = createModule();
    const source = dataSource(module);
    const updates = vi.fn();
    await source.subscribe({ range: Range(0, 20) }, updates);
    updates.mockClear();

    const version = cell(module, 2, "version") as number;
    await expect(
      rpc(source, "updateModule", {
        changes: JSON.stringify({ title: "Users & roles" }),
        expectedVersion: version,
        id: 2,
      }),
    ).resolves.toMatchObject({ type: "SUCCESS_RESULT" });
    expect(cell(module, 2, "title")).toBe("Users & roles");
    expect(cell(module, 2, "version")).toBe(version + 1);
    expect(updates).toHaveBeenCalled();

    const stale = await rpc(source, "updateModule", {
      changes: JSON.stringify({ title: "Again" }),
      expectedVersion: version,
      id: 2,
    });
    expect(stale).toMatchObject({ type: "ERROR_RESULT" });
    expect(cell(module, 2, "title")).toBe("Users & roles");
  });

  it("changes the access role through updateModule", async () => {
    const module = createModule();
    const source = dataSource(module, "modulePermissions");
    await rpc(source, "updateModule", {
      changes: JSON.stringify({ accessRole: "admins" }),
      expectedVersion: cell(module, 2, "version") as number,
      id: 2,
    });
    expect(permissionsFor(module, 2)).toEqual(["admins"]);
  });

  it("enables and disables a module", async () => {
    const module = createModule();
    const source = dataSource(module);
    await rpc(source, "setModuleEnabled", { enabled: false, id: 3 });
    expect(cell(module, 3, "enabled")).toBe(false);

    // module 6 has no access role, so it cannot be enabled
    const result = await rpc(source, "setModuleEnabled", {
      enabled: true,
      id: 6,
    });
    expect(result.type).toBe("ERROR_RESULT");
    expect(cell(module, 6, "enabled")).toBe(false);
  });

  it("deletes a module, requiring confirmation for children", async () => {
    const module = createModule();
    const source = dataSource(module);
    const child = module.modules.find(
      ({ parentModuleId }) => parentModuleId !== 0,
    )!;
    const parentId = child.parentModuleId;

    const refused = await rpc(source, "deleteModule", { id: parentId });
    expect(refused.type).toBe("ERROR_RESULT");

    await expect(
      rpc(source, "deleteModule", { deleteChildren: true, id: parentId }),
    ).resolves.toEqual({
      data: { deletedIds: expect.arrayContaining([parentId, child.id]) },
      type: "SUCCESS_RESULT",
    });
    expect(module.tables.modules.findByKey(String(parentId))).toBeUndefined();
    expect(module.tables.modules.findByKey(String(child.id))).toBeUndefined();
    expect(permissionsFor(module, parentId)).toEqual([]);
  });

  it("keeps the browser implementation on the contracts entry point", async () => {
    const source = await readFile(
      resolve(__dirname, "../src/module-admin/ModuleAdminModule.ts"),
      "utf8",
    );

    expect(source).toContain('from "@heswell/module-admin/contracts"');
    expect(source).not.toContain('from "@heswell/module-admin"');
    expect(source).not.toContain("vuu-portal");
  });
});
