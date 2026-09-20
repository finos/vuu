import {
  USER_ADMIN_RPC_CONTRACT,
  USER_ADMIN_TABLE_SCHEMAS,
} from "@heswell/user-admin/contracts";
import { describe, expect, it, vi } from "vitest";
import { Range } from "@vuu-ui/vuu-utils";
import moduleContainer from "../src/core/module/ModuleContainer";
import { UserAdminModule } from "../src/user-admin/UserAdminModule";
import { USER_ADMIN_INITIAL_SNAPSHOT } from "../src/user-admin/initialSnapshot";
import type { TickingArrayDataSource } from "../src/TickingArrayDataSource";

const createModule = (
  snapshot: typeof USER_ADMIN_INITIAL_SNAPSHOT = structuredClone(
    USER_ADMIN_INITIAL_SNAPSHOT,
  ),
) => new UserAdminModule(snapshot);

const dataSource = (module: UserAdminModule) =>
  module.createDataSource("users", "user-admin-test", {
    columns: USER_ADMIN_TABLE_SCHEMAS.users.columns.map(({ name }) => name),
  }) as TickingArrayDataSource;

const rpc = (
  source: TickingArrayDataSource,
  rpcName: string,
  params: Record<string, unknown>,
) =>
  source.rpcRequest({
    params: params as never,
    rpcName,
    type: "RPC_REQUEST",
  });

describe("UserAdminModule", () => {
  it("registers USER_ADMIN and uses every shared table schema", () => {
    const module = createModule();

    expect(module.name).toBe("USER_ADMIN");
    expect(moduleContainer.get("USER_ADMIN")).toBe(module);
    expect(module.getTableList().sort()).toEqual(
      Object.keys(USER_ADMIN_TABLE_SCHEMAS).sort(),
    );
    for (const [tableName, schema] of Object.entries(
      USER_ADMIN_TABLE_SCHEMAS,
    )) {
      expect(module.getTableSchema(tableName)).toBe(schema);
      expect(module.tables[tableName].schema).toBe(schema);
    }
  });

  it("projects initial rows in snapshot and relationship order", () => {
    const module = createModule();
    const { tables } = module;

    expect(
      tables.users.data.map((row) => row[tables.users.map.user_id]),
    ).toEqual(["user-alice", "user-bob"]);
    expect(
      tables.user_groups.data.map(
        (row) => row[tables.user_groups.map.membership_id],
      ),
    ).toEqual([
      "user-alice:group-user-admin-read",
      "user-bob:group-module-admin-read",
      "user-alice:group-basket-trading-read",
      "user-alice:group-admins",
    ]);
    expect(
      tables.user_group_roles.data.map(
        (row) => row[tables.user_group_roles.map.id],
      ),
    ).toEqual([
      "user-alice:group-user-admin-read:group-user-admin-read:role-user-admin-access",
      "user-bob:group-module-admin-read:group-module-admin-read:role-module-admin-access",
      "user-alice:group-basket-trading-read:group-basket-trading-read:role-basket-trading-access",
      "user-alice:group-admins:group-admins:role-admin",
    ]);
    expect(
      tables.users.findByKey("user-alice")?.[tables.users.map.module_access],
    ).toBe("basket-trading-access,user-admin-access");
  });

  it("registers every shared RPC on each table", () => {
    const module = createModule();
    const expected = Object.keys(USER_ADMIN_RPC_CONTRACT).sort();

    for (const services of Object.values(module.services)) {
      expect(services.map(({ rpcName }) => rpcName).sort()).toEqual(expected);
    }
  });

  it("offers filter-table access as an editable local module permission", async () => {
    const source = dataSource(createModule());
    const result = await rpc(source, "getUserModuleAccessOptions", {
      userId: "user-alice",
    });

    expect(result).toMatchObject({
      data: {
        modules: expect.arrayContaining([
          {
            accessRole: "feature-filter-table-access",
            clientIdentifier: "vuu-portal",
            groups: [
              expect.objectContaining({
                groupId: "group-feature-filter-table-read",
                isDefault: true,
                roleId: "role-feature-filter-table-access",
              }),
            ],
            selectedGroupIds: [],
          },
        ]),
      },
      type: "SUCCESS_RESULT",
    });
  });

  it("creates, updates, and deletes users through the in-memory store", async () => {
    const module = createModule();
    const source = dataSource(module);

    await expect(
      rpc(source, "addUser", {
        email: "carol@example.com",
        group_ids: ["group-user-admin-read"],
        username: "carol",
      }),
    ).resolves.toMatchObject({ type: "SUCCESS_RESULT" });
    expect(
      module.tables.users.findByKey("user-1")?.[
        module.tables.users.map.username
      ],
    ).toBe("carol");
    expect(
      module.tables.user_groups.findByKey("user-1:group-user-admin-read"),
    ).toBeDefined();

    await expect(
      rpc(source, "addUser", { username: "CAROL" }),
    ).resolves.toEqual({
      errorMessage: "username must be unique",
      type: "ERROR_RESULT",
    });
    await expect(
      rpc(source, "updateUser", {
        userId: "user-bob",
        username: "carol",
      }),
    ).resolves.toEqual({
      errorMessage: "username must be unique",
      type: "ERROR_RESULT",
    });

    await rpc(source, "updateUser", {
      firstName: "Caroline",
      group_ids: ["group-module-admin-read"],
      userId: "user-1",
    });
    expect(
      module.tables.users.findByKey("user-1")?.[
        module.tables.users.map.first_name
      ],
    ).toBe("Caroline");
    expect(
      module.tables.user_groups.findByKey("user-1:group-user-admin-read"),
    ).toBe(undefined);
    expect(
      module.tables.user_groups.findByKey("user-1:group-module-admin-read"),
    ).toBeDefined();

    await rpc(source, "deleteUser", { userId: "user-1" });
    expect(module.tables.users.findByKey("user-1")).toBeUndefined();
    expect(
      module.tables.user_groups.findByKey("user-1:group-module-admin-read"),
    ).toBeUndefined();
  });

  it("creates, updates, and removes groups, clients, and roles", async () => {
    const module = createModule();
    const source = dataSource(module);

    await rpc(source, "addGroup", { name: "demo-users" });
    expect(module.tables.groups.findByKey("group-1")).toBeDefined();
    await rpc(source, "updateGroup", {
      groupId: "group-1",
      name: "demo-operators",
    });
    expect(
      (await module.store.snapshot()).groups.find(({ id }) => id === "group-1"),
    ).toMatchObject({ name: "demo-operators" });
    expect(
      module.tables.groups.findByKey("group-1")?.[
        module.tables.groups.map.group_display_name
      ],
    ).toBe("operators");

    await rpc(source, "addClient", {
      clientId: "vuu-demo",
      name: "VUU Demo",
    });
    await rpc(source, "updateClient", {
      clientId: "vuu-demo",
      description: "Local demo client",
    });
    expect(
      module.tables.clients.findByKey("client-2")?.[
        module.tables.clients.map.description
      ],
    ).toBe("Local demo client");

    await rpc(source, "addClientRole", {
      clientId: "vuu-demo",
      name: "demo-access",
    });
    await rpc(source, "updateRole", {
      clientId: "vuu-demo",
      name: "demo-operator",
      roleName: "demo-access",
    });
    expect(
      module.tables.roles.findByKey("role-3")?.[
        module.tables.roles.map.role_display_name
      ],
    ).toBe("operator");
    await rpc(source, "assignGroupRole", {
      clientId: "vuu-demo",
      groupId: "group-1",
      roleName: "demo-operator",
    });
    expect(module.tables.group_roles.findByKey("group-1:role-3")).toBeDefined();
    await rpc(source, "removeGroupRole", {
      clientId: "vuu-demo",
      groupId: "group-1",
      roleName: "demo-operator",
    });
    expect(
      module.tables.group_roles.findByKey("group-1:role-3"),
    ).toBeUndefined();

    await rpc(source, "deleteGroup", { groupId: "group-1" });
    expect(module.tables.groups.findByKey("group-1")).toBeUndefined();
  });

  it("reconciles relationship changes and module access assignments", async () => {
    const module = createModule();
    const source = dataSource(module);

    await rpc(source, "assignUserToGroup", {
      groupId: "group-module-admin-read",
      userId: "user-alice",
    });
    expect(
      module.tables.user_group_roles.findByKey(
        "user-alice:group-module-admin-read:group-module-admin-read:role-module-admin-access",
      ),
    ).toBeDefined();

    await rpc(source, "removeUserFromGroup", {
      groupId: "group-module-admin-read",
      userId: "user-alice",
    });
    expect(
      module.tables.user_group_roles.findByKey(
        "user-alice:group-module-admin-read:group-module-admin-read:role-module-admin-access",
      ),
    ).toBeUndefined();

    const options = await rpc(source, "getUserModuleAccessOptions", {
      userId: "user-alice",
    });
    expect(options).toMatchObject({
      data: {
        modules: expect.arrayContaining([
          expect.objectContaining({
            accessRole: "basket-trading-access",
            selectedGroupId: "group-basket-trading-read",
            groups: expect.arrayContaining([
              expect.objectContaining({
                groupDisplayName: "read",
                roleDisplayName: "access",
              }),
            ]),
          }),
        ]),
      },
      type: "SUCCESS_RESULT",
    });

    await rpc(source, "setUserModuleAccess", {
      assignments: JSON.stringify([
        {
          groupId: "group-module-admin-read",
          accessRole: "module-admin-access",
        },
      ]),
      userId: "user-alice",
    });
    expect(
      module.tables.user_groups.findByKey("user-alice:group-user-admin-read"),
    ).toBeUndefined();
    expect(
      module.tables.user_groups.findByKey(
        "user-alice:group-basket-trading-read",
      ),
    ).toBeUndefined();
    expect(
      module.tables.user_groups.findByKey("user-alice:group-module-admin-read"),
    ).toBeDefined();
    expect(
      module.tables.user_groups.findByKey("user-alice:group-admins"),
    ).toBeDefined();
  });

  it("returns configured display names in module access options", async () => {
    const snapshot = structuredClone(USER_ADMIN_INITIAL_SNAPSHOT);
    const group = snapshot.groups.find(
      ({ id }) => id === "group-basket-trading-read",
    );
    const role = snapshot.clientRoles.find(
      ({ role }) => role.id === "role-basket-trading-access",
    )?.role;
    if (!group || !role) {
      throw new Error("Expected basket trading access fixture");
    }
    group.groupDisplayName = "Read-only traders";
    role.roleDisplayName = "Trading permission";

    const source = dataSource(createModule(snapshot));
    const result = await rpc(source, "getUserModuleAccessOptions", {
      userId: "user-alice",
    });

    expect(result).toMatchObject({
      data: {
        modules: expect.arrayContaining([
          expect.objectContaining({
            accessRole: "basket-trading-access",
            groups: expect.arrayContaining([
              expect.objectContaining({
                groupId: "group-basket-trading-read",
                groupDisplayName: "Read-only traders",
                roleId: "role-basket-trading-access",
                roleDisplayName: "Trading permission",
              }),
            ]),
          }),
        ]),
      },
      type: "SUCCESS_RESULT",
    });
  });

  it("reports every selected group for a module access option", async () => {
    const module = createModule();
    const source = dataSource(module);

    await rpc(source, "setUserModuleAccess", {
      assignments: JSON.stringify([
        {
          groupId: "group-user-admin-read",
          accessRole: "user-admin-access",
        },
        {
          groupId: "group-user-admin-admin",
          accessRole: "user-admin-access",
        },
      ]),
      userId: "user-alice",
    });

    const result = await rpc(source, "getUserModuleAccessOptions", {
      userId: "user-alice",
    });
    expect(result.type).toBe("SUCCESS_RESULT");
    if (result.type !== "SUCCESS_RESULT") {
      throw new Error(result.errorMessage);
    }
    expect(
      (
        result.data as {
          modules: { accessRole: string; selectedGroupIds: string[] }[];
        }
      ).modules.find(({ accessRole }) => accessRole === "user-admin-access"),
    ).toMatchObject({
      selectedGroupIds: ["group-user-admin-admin", "group-user-admin-read"],
    });
  });

  it("rejects legacy loginRole assignment payloads", async () => {
    const module = createModule();
    const source = dataSource(module);

    await expect(
      rpc(source, "setUserModuleAccess", {
        assignments: JSON.stringify([
          {
            groupId: "group-user-admin-read",
            loginRole: "user-admin-access",
          },
        ]),
        userId: "user-alice",
      }),
    ).resolves.toEqual({
      errorMessage:
        "assignments must be a JSON array of accessRole and groupId strings",
      type: "ERROR_RESULT",
    });
  });

  it("saves session permissions and reconciles user module access columns", async () => {
    const module = createModule();
    const source = dataSource(module);
    const session = await source.createSessionDataSource("All");

    await session.editCell(
      "user-alice",
      "permissions",
      JSON.stringify([
        {
          clientIdentifier: "vuu-portal",
          groupIds: ["group-user-admin-read", "group-user-admin-admin"],
          accessRole: "user-admin-access",
        },
        {
          clientIdentifier: "vuu-portal",
          groupIds: ["group-basket-trading-trade"],
          accessRole: "basket-trading-access",
        },
      ]),
    );
    await session.endEditSession(true);

    expect(
      module.tables.user_groups.findByKey("user-alice:group-user-admin-admin"),
    ).toBeDefined();
    expect(
      module.tables.user_groups.findByKey(
        "user-alice:group-basket-trading-read",
      ),
    ).toBeUndefined();
    expect(
      module.tables.user_groups.findByKey(
        "user-alice:group-basket-trading-trade",
      ),
    ).toBeDefined();
    expect(
      module.tables.users.findByKey("user-alice")?.[
        module.tables.users.map.module_access
      ],
    ).toBe("basket-trading-access,user-admin-access");
    expect(
      module.tables.groups.findByKey("group-user-admin-read")?.[
        module.tables.groups.map.group_display_name
      ],
    ).toBe("read");
    expect(
      module.tables.roles.findByKey("role-user-admin-access")?.[
        module.tables.roles.map.role_display_name
      ],
    ).toBe("access");
    expect(
      module.tables.users.findByKey("user-alice")?.[
        module.tables.users.map.module_access_count
      ],
    ).toBe(2);
  });

  it("rejects username changes through a user edit session", async () => {
    const module = createModule();
    const source = dataSource(module);
    const session = await source.createSessionDataSource("All");

    await session.editCell("user-alice", "username", "alice-renamed");

    await expect(session.endEditSession(true)).rejects.toThrow(
      "username is read-only",
    );
    expect(
      module.tables.users.findByKey("user-alice")?.[
        module.tables.users.map.username
      ],
    ).toBe("alice");
  });

  it("rejects malformed RPC parameters without changing local tables", async () => {
    const module = createModule();
    const source = dataSource(module);
    const initialCount = module.tables.users.data.length;

    await expect(rpc(source, "addUser", {})).resolves.toEqual({
      errorMessage: "username must be a non-empty string",
      type: "ERROR_RESULT",
    });
    await expect(
      rpc(source, "deleteUser", { unexpected: "value", userId: "user-alice" }),
    ).resolves.toEqual({
      errorMessage: "deleteUser received an unsupported parameter: unexpected",
      type: "ERROR_RESULT",
    });
    expect(module.tables.users.data).toHaveLength(initialCount);
  });

  it("emits reconciled table updates to subscribed data sources", async () => {
    const module = createModule();
    const source = dataSource(module);
    const updates = vi.fn();

    await source.subscribe({ range: Range(0, 20) }, updates);
    updates.mockClear();

    await rpc(source, "updateUser", {
      firstName: "Alicia",
      userId: "user-alice",
    });

    expect(updates).toHaveBeenCalled();
    expect(
      module.tables.users.findByKey("user-alice")?.[
        module.tables.users.map.first_name
      ],
    ).toBe("Alicia");
  });
});
