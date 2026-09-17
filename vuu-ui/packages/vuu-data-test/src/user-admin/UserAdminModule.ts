import {
  USER_ADMIN_RPC_CONTRACT,
  USER_ADMIN_TABLE_SCHEMAS,
  type SupportedUserAdminRpc,
  type UserAdminSnapshot,
  type UserAdminTableName,
  type UserModuleAccessAssignment,
} from "@heswell/user-admin/contracts";
import { InMemoryUserAdminStore } from "@heswell/user-admin/in-memory";
import type { TableSchema } from "@vuu-ui/vuu-data-types";
import {
  type RpcService,
  type ServiceHandler,
  VuuModule,
} from "../core/module/VuuModule";
import { buildDataColumnMapFromSchema, type Table } from "../Table";
import tableContainer from "../core/table/TableContainer";
import { reconcileUserAdminTables } from "./snapshot-projection";

type NamedParams = Record<string, unknown>;
type UserAdminTables = Record<UserAdminTableName, Table>;

const createTable = (tableName: UserAdminTableName) => {
  const schema = USER_ADMIN_TABLE_SCHEMAS[tableName] satisfies TableSchema;
  return tableContainer.createTable(
    schema,
    [],
    buildDataColumnMapFromSchema(schema),
  );
};

const createTables = (): UserAdminTables => ({
  clients: createTable("clients"),
  group_roles: createTable("group_roles"),
  groups: createTable("groups"),
  roles: createTable("roles"),
  user_group_roles: createTable("user_group_roles"),
  user_groups: createTable("user_groups"),
  users: createTable("users"),
});

export const USER_ADMIN_INITIAL_SNAPSHOT: UserAdminSnapshot = {
  clients: [
    {
      clientId: "vuu-portal",
      description: "VUU portal",
      enabled: true,
      id: "client-portal",
      name: "VUU Portal",
    },
    {
      clientId: "vuu-orders",
      description: "Order management",
      enabled: true,
      id: "client-orders",
      name: "VUU Orders",
    },
  ],
  clientRoles: [
    {
      client: {
        clientId: "vuu-portal",
        id: "client-portal",
        name: "VUU Portal",
      },
      role: {
        clientRole: true,
        containerId: "client-portal",
        id: "role-orders-access",
        name: "orders-access",
      },
    },
    {
      client: {
        clientId: "vuu-portal",
        id: "client-portal",
        name: "VUU Portal",
      },
      role: {
        clientRole: true,
        containerId: "client-portal",
        id: "role-risk-access",
        name: "risk-access",
      },
    },
    {
      client: {
        clientId: "realm",
        id: "realm",
        name: "Realm",
      },
      role: {
        id: "role-admin",
        name: "admin",
      },
    },
  ],
  groupRoles: [
    {
      client: {
        clientId: "vuu-portal",
        id: "client-portal",
        name: "VUU Portal",
      },
      group: {
        id: "group-orders",
        name: "orders-users",
        path: "/vuu/orders-users",
      },
      role: {
        id: "role-orders-access",
        name: "orders-access",
      },
    },
    {
      client: {
        clientId: "vuu-portal",
        id: "client-portal",
        name: "VUU Portal",
      },
      group: {
        id: "group-risk",
        name: "risk-users",
        path: "/vuu/risk-users",
      },
      role: {
        id: "role-risk-access",
        name: "risk-access",
      },
    },
    {
      group: {
        id: "group-admins",
        name: "administrators",
        path: "/vuu/administrators",
      },
      role: {
        id: "role-admin",
        name: "admin",
      },
    },
  ],
  groups: [
    {
      id: "group-orders",
      name: "orders-users",
      path: "/vuu/orders-users",
    },
    {
      id: "group-risk",
      name: "risk-users",
      path: "/vuu/risk-users",
    },
    {
      id: "group-admins",
      name: "administrators",
      path: "/vuu/administrators",
    },
  ],
  timestamp: 1_710_000_000_000,
  userGroups: [
    {
      group: {
        id: "group-orders",
        name: "orders-users",
        path: "/vuu/orders-users",
      },
      user: {
        email: "alice@example.com",
        id: "user-alice",
        username: "alice",
      },
    },
    {
      group: {
        id: "group-risk",
        name: "risk-users",
        path: "/vuu/risk-users",
      },
      user: {
        email: "bob@example.com",
        id: "user-bob",
        username: "bob",
      },
    },
    {
      group: {
        id: "group-admins",
        name: "administrators",
        path: "/vuu/administrators",
      },
      user: {
        email: "alice@example.com",
        id: "user-alice",
        username: "alice",
      },
    },
  ],
  users: [
    {
      email: "alice@example.com",
      emailVerified: true,
      enabled: true,
      firstName: "Alice",
      id: "user-alice",
      lastName: "Admin",
      username: "alice",
    },
    {
      email: "bob@example.com",
      emailVerified: true,
      enabled: true,
      firstName: "Bob",
      id: "user-bob",
      lastName: "Builder",
      username: "bob",
    },
  ],
};

const errorResult = (error: unknown) => ({
  errorMessage:
    error instanceof Error ? error.message : "User admin request failed",
  type: "ERROR_RESULT" as const,
});

const isRecord = (value: unknown): value is NamedParams =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readParams = (
  request: Parameters<ServiceHandler>[0],
  rpcName: SupportedUserAdminRpc,
) => {
  if (request.type !== "RPC_REQUEST" || request.rpcName !== rpcName) {
    throw new Error(`Expected ${rpcName} RPC request`);
  }
  if (!isRecord(request.params)) {
    throw new Error(`${rpcName} requires named parameters`);
  }

  const allowed = new Set<string>(USER_ADMIN_RPC_CONTRACT[rpcName]);
  for (const name of Object.keys(request.params)) {
    if (!allowed.has(name)) {
      throw new Error(`${rpcName} received an unsupported parameter: ${name}`);
    }
  }
  return request.params;
};

const requiredString = (params: NamedParams, name: string) => {
  const value = params[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${name} must be a non-empty string`);
  }
  return value;
};

const optionalString = (params: NamedParams, name: string) => {
  const value = params[name];
  if (value !== undefined && typeof value !== "string") {
    throw new Error(`${name} must be a string`);
  }
  return value;
};

const optionalBoolean = (params: NamedParams, name: string) => {
  const value = params[name];
  if (value !== undefined && typeof value !== "boolean") {
    throw new Error(`${name} must be a boolean`);
  }
  return value;
};

const optionalStringArray = (params: NamedParams, name: string) => {
  const value = params[name];
  if (
    value !== undefined &&
    (!Array.isArray(value) || value.some((item) => typeof item !== "string"))
  ) {
    throw new Error(`${name} must be an array of strings`);
  }
  return value as string[] | undefined;
};

const reference = (params: NamedParams, idName: string, name: string) => {
  const id = optionalString(params, idName);
  const label = optionalString(params, name);
  if (!id && !label) {
    throw new Error(`${idName} or ${name} is required`);
  }
  return { id, label };
};

const parseAssignments = (value: string): UserModuleAccessAssignment[] => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("assignments must be valid JSON");
  }
  if (
    !Array.isArray(parsed) ||
    parsed.some(
      (assignment) =>
        !isRecord(assignment) ||
        typeof assignment.loginRole !== "string" ||
        assignment.loginRole.length === 0 ||
        typeof assignment.groupId !== "string" ||
        assignment.groupId.length === 0 ||
        Object.keys(assignment).some(
          (name) => name !== "loginRole" && name !== "groupId",
        ),
    )
  ) {
    throw new Error(
      "assignments must be a JSON array of loginRole and groupId strings",
    );
  }
  return parsed;
};

export class UserAdminModule extends VuuModule<UserAdminTableName> {
  #tables: UserAdminTables;
  readonly store: InMemoryUserAdminStore;

  constructor(snapshot: UserAdminSnapshot = USER_ADMIN_INITIAL_SNAPSHOT) {
    super("USER_ADMIN");
    this.store = new InMemoryUserAdminStore(snapshot);
    this.#tables = createTables();
    reconcileUserAdminTables(snapshot, this.#tables);
  }

  get schemas(): Record<UserAdminTableName, Readonly<TableSchema>> {
    return USER_ADMIN_TABLE_SCHEMAS;
  }

  get tables() {
    return this.#tables;
  }

  get menus() {
    return {
      clients: undefined,
      group_roles: undefined,
      groups: undefined,
      roles: undefined,
      user_group_roles: undefined,
      user_groups: undefined,
      users: undefined,
    };
  }

  get visualLinks() {
    return undefined;
  }

  get menuServices() {
    return undefined;
  }

  get services(): Record<UserAdminTableName, RpcService[]> {
    const services = [
      { rpcName: "addUser", service: this.addUser },
      { rpcName: "updateUser", service: this.updateUser },
      { rpcName: "deleteUser", service: this.deleteUser },
      { rpcName: "addGroup", service: this.addGroup },
      { rpcName: "updateGroup", service: this.updateGroup },
      { rpcName: "deleteGroup", service: this.deleteGroup },
      { rpcName: "addClient", service: this.addClient },
      { rpcName: "updateClient", service: this.updateClient },
      { rpcName: "addRole", service: this.addRole },
      { rpcName: "addClientRole", service: this.addClientRole },
      { rpcName: "updateRole", service: this.updateRole },
      { rpcName: "assignGroupRole", service: this.assignGroupRole },
      { rpcName: "removeGroupRole", service: this.removeGroupRole },
      { rpcName: "assignUserToGroup", service: this.assignUserToGroup },
      { rpcName: "removeUserFromGroup", service: this.removeUserFromGroup },
      {
        rpcName: "getUserModuleAccessOptions",
        service: this.getUserModuleAccessOptions,
      },
      { rpcName: "setUserModuleAccess", service: this.setUserModuleAccess },
    ];
    return {
      clients: services,
      group_roles: services,
      groups: services,
      roles: services,
      user_group_roles: services,
      user_groups: services,
      users: services,
    };
  }

  async reconcile() {
    reconcileUserAdminTables(await this.store.snapshot(), this.#tables);
  }

  private mutation = (
    rpcName: Exclude<SupportedUserAdminRpc, "getUserModuleAccessOptions">,
    mutate: (params: NamedParams) => Promise<void>,
  ): ServiceHandler => {
    return async (request) => {
      try {
        await mutate(readParams(request, rpcName));
        await this.reconcile();
        return { data: undefined, type: "SUCCESS_RESULT" };
      } catch (error) {
        return errorResult(error);
      }
    };
  };

  private addUser = this.mutation("addUser", async (params) => {
    const groupIds = optionalStringArray(params, "group_ids");
    await this.store.addUser({
      email: optionalString(params, "email"),
      emailVerified: optionalBoolean(params, "emailVerified"),
      enabled: optionalBoolean(params, "enabled"),
      firstName: optionalString(params, "firstName"),
      lastName: optionalString(params, "lastName"),
      temporary_password: optionalString(params, "temporary_password"),
      username: requiredString(params, "username"),
    });
    if (groupIds) {
      const user = await this.store.findUserByUsername(
        requiredString(params, "username"),
      );
      if (!user) {
        throw new Error("Created user could not be found");
      }
      await this.store.syncUserGroups(user.id, groupIds);
    }
  });

  private updateUser = this.mutation("updateUser", async (params) => {
    const groupIds = optionalStringArray(params, "group_ids");
    const userId = requiredString(params, "userId");
    await this.store.updateUser({
      email: optionalString(params, "email"),
      emailVerified: optionalBoolean(params, "emailVerified"),
      enabled: optionalBoolean(params, "enabled"),
      firstName: optionalString(params, "firstName"),
      lastName: optionalString(params, "lastName"),
      temporary_password: optionalString(params, "temporary_password"),
      userId,
      username: optionalString(params, "username"),
    });
    if (groupIds) {
      await this.store.syncUserGroups(userId, groupIds);
    }
  });

  private deleteUser = this.mutation("deleteUser", (params) =>
    this.store.deleteUser(requiredString(params, "userId")),
  );

  private addGroup = this.mutation("addGroup", (params) =>
    this.store.addGroup({ name: requiredString(params, "name") }),
  );

  private updateGroup = this.mutation("updateGroup", (params) =>
    this.store.updateGroup(requiredString(params, "groupId"), {
      name: requiredString(params, "name"),
    }),
  );

  private deleteGroup = this.mutation("deleteGroup", (params) =>
    this.store.deleteGroup(requiredString(params, "groupId")),
  );

  private addClient = this.mutation("addClient", (params) =>
    this.store.addClient({
      clientId: requiredString(params, "clientId"),
      description: optionalString(params, "description"),
      enabled: optionalBoolean(params, "enabled"),
      name: optionalString(params, "name"),
    }),
  );

  private updateClient = this.mutation("updateClient", (params) =>
    this.store.updateClient(requiredString(params, "clientId"), {
      description: optionalString(params, "description"),
      enabled: optionalBoolean(params, "enabled"),
      name: optionalString(params, "name"),
    }),
  );

  private addRole = this.mutation("addRole", (params) =>
    this.store.addRole({
      description: optionalString(params, "description"),
      name: requiredString(params, "name"),
    }),
  );

  private addClientRole = this.mutation("addClientRole", (params) =>
    this.store.addClientRole(
      { clientKey: requiredString(params, "clientId") },
      {
        description: optionalString(params, "description"),
        name: requiredString(params, "name"),
      },
    ),
  );

  private updateRole = this.mutation("updateRole", async (params) => {
    const clientId = optionalString(params, "clientId");
    const changes = {
      description: optionalString(params, "description"),
      name: optionalString(params, "name"),
    };
    if (clientId) {
      await this.store.updateClientRole(
        clientId,
        requiredString(params, "roleName"),
        changes,
      );
    } else {
      await this.store.updateRealmRole(
        requiredString(params, "roleId"),
        changes,
      );
    }
  });

  private assignGroupRole = this.mutation("assignGroupRole", (params) => {
    const group = reference(params, "groupId", "groupName");
    const role = reference(params, "roleId", "roleName");
    const clientId = optionalString(params, "clientId");
    return this.store.addRoleToGroup(
      { groupId: group.id, groupName: group.label },
      { roleId: role.id, roleName: role.label },
      clientId ? { clientKey: clientId } : undefined,
    );
  });

  private removeGroupRole = this.mutation("removeGroupRole", (params) => {
    const group = reference(params, "groupId", "groupName");
    const role = reference(params, "roleId", "roleName");
    const clientId = optionalString(params, "clientId");
    return this.store.removeRoleFromGroup(
      { groupId: group.id, groupName: group.label },
      { roleId: role.id, roleName: role.label },
      clientId ? { clientKey: clientId } : undefined,
    );
  });

  private assignUserToGroup = this.mutation("assignUserToGroup", (params) => {
    const user = reference(params, "userId", "username");
    const group = reference(params, "groupId", "groupName");
    return this.store.addUserToGroup(
      { userId: user.id, username: user.label },
      { groupId: group.id, groupName: group.label },
    );
  });

  private removeUserFromGroup = this.mutation(
    "removeUserFromGroup",
    (params) => {
      const user = reference(params, "userId", "username");
      const group = reference(params, "groupId", "groupName");
      return this.store.removeUserFromGroup(
        { userId: user.id, username: user.label },
        { groupId: group.id, groupName: group.label },
      );
    },
  );

  private getUserModuleAccessOptions: ServiceHandler = async (request) => {
    try {
      const params = readParams(request, "getUserModuleAccessOptions");
      return {
        data: await this.store.getUserModuleAccessOptions(
          requiredString(params, "userId"),
        ),
        type: "SUCCESS_RESULT",
      };
    } catch (error) {
      return errorResult(error);
    }
  };

  private setUserModuleAccess = this.mutation("setUserModuleAccess", (params) =>
    this.store.setUserModuleAccess(
      requiredString(params, "userId"),
      parseAssignments(requiredString(params, "assignments")),
    ),
  );
}

export const userAdminModule = new UserAdminModule();
