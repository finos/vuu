import {
  USER_ADMIN_RPC_CONTRACT,
  USER_ADMIN_TABLE_SCHEMAS as schema,
  type SupportedUserAdminRpc,
  type UserAdminSnapshot,
  type UserAdminTableName,
  type UserModuleAccessAssignment,
  type UserModuleAccessPermission,
} from "@heswell/user-admin/contracts";
import { InMemoryUserAdminStore } from "@heswell/user-admin/in-memory";
import type { TableSchema } from "@vuu-ui/vuu-data-types";
import {
  VuuModule,
  type RpcService,
  type ServiceHandler,
} from "../core/module/VuuModule";
import tableContainer from "../core/table/TableContainer";
import { buildDataColumnMapFromSchema, Table } from "../Table";
import { USER_ADMIN_INITIAL_SNAPSHOT } from "./initialSnapshot";
import {
  reconcileUserAdminTables,
  resolveDisplayName,
} from "./snapshot-projection";

type NamedParams = Record<string, unknown>;
type UserAdminTables = Record<UserAdminTableName, Table>;

const createTables = (): UserAdminTables => ({
  clients: tableContainer.createTable(schema.clients),
  group_roles: tableContainer.createTable(schema.group_roles),
  groups: tableContainer.createTable(schema.groups),
  roles: tableContainer.createTable(schema.roles),
  user_group_roles: tableContainer.createTable(schema.user_group_roles),
  user_groups: tableContainer.createTable(schema.user_groups),
  users: tableContainer.createTable(schema.users),
});

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
        typeof assignment.accessRole !== "string" ||
        assignment.accessRole.length === 0 ||
        typeof assignment.groupId !== "string" ||
        assignment.groupId.length === 0 ||
        Object.keys(assignment).some(
          (name) => name !== "accessRole" && name !== "groupId",
        ),
    )
  ) {
    throw new Error(
      "assignments must be a JSON array of accessRole and groupId strings",
    );
  }
  return parsed;
};

const parseSessionPermissions = (
  value: unknown,
): UserModuleAccessAssignment[] => {
  if (typeof value !== "string") {
    throw new Error("permissions must be a serialized array");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("permissions must be valid JSON");
  }
  if (!Array.isArray(parsed)) {
    throw new Error("permissions must contain application group assignments");
  }
  const accessRoles = new Set<string>();
  const permissions: UserModuleAccessPermission[] = parsed.map(
    (application, index) => {
      if (
        !isRecord(application) ||
        Object.keys(application).some(
          (field) =>
            field !== "clientIdentifier" &&
            field !== "accessRole" &&
            field !== "groupIds",
        ) ||
        typeof application.clientIdentifier !== "string" ||
        application.clientIdentifier.length === 0 ||
        typeof application.accessRole !== "string" ||
        application.accessRole.length === 0 ||
        !Array.isArray(application.groupIds) ||
        application.groupIds.some(
          (groupId) => typeof groupId !== "string" || groupId.length === 0,
        )
      ) {
        throw new Error(
          `permissions[${index}] must contain clientIdentifier, accessRole, and groupIds`,
        );
      }
      if (accessRoles.has(application.accessRole)) {
        throw new Error(
          `permissions contains duplicate accessRole: ${application.accessRole}`,
        );
      }
      const groupIds = application.groupIds as string[];
      if (new Set(groupIds).size !== groupIds.length) {
        throw new Error(
          `permissions contains duplicate group IDs for: ${application.accessRole}`,
        );
      }
      accessRoles.add(application.accessRole);
      return {
        clientIdentifier: application.clientIdentifier,
        accessRole: application.accessRole,
        groupIds,
      };
    },
  );
  return permissions.flatMap(({ groupIds, accessRole }) =>
    groupIds.map((groupId) => ({ accessRole, groupId })),
  );
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
    return schema;
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

  protected override createSessionTable(
    sourceTable: Table,
    sessionTableName: string,
    editSessionMode:
      | import("@vuu-ui/vuu-data-types").EditSessionMode
      | import("@vuu-ui/vuu-data-types").CopyOption,
    dataSource: import("../TickingArrayDataSource").TickingArrayDataSource,
    sessionType?: import("@vuu-ui/vuu-data-types").SessionType,
  ) {
    const sessionTable = super.createSessionTable(
      sourceTable,
      sessionTableName,
      editSessionMode,
      dataSource,
      sessionType,
    );
    if (sourceTable.name !== "users") return sessionTable;

    const sessionSchema = {
      ...sessionTable.schema,
      columns: sessionTable.schema.columns.concat({
        name: "permissions",
        serverDataType: "string" as const,
      }),
    };
    return new Table(
      sessionSchema,
      sessionTable.data.map((row) => row.concat("")),
      buildDataColumnMapFromSchema(sessionSchema),
    );
  }

  protected override async beforeSessionSave(
    sourceTable: Table,
    sessionTable: Table,
  ) {
    if (sourceTable.name !== "users") return;
    const permissionsIndex = sessionTable.map.permissions;
    const actionIndex = sessionTable.map.vuuAction;
    const userIdIndex = sessionTable.map.user_id;
    const usernameIndex = sessionTable.map.username;
    for (const row of sessionTable.data) {
      if (row[actionIndex] !== "editCell") continue;

      const userId = String(row[userIdIndex]);
      const sourceRow = sourceTable.findByKey(userId);
      if (
        !sourceRow ||
        sourceRow[sourceTable.map.username] !== row[usernameIndex]
      ) {
        throw new Error("username is read-only");
      }

      if (
        typeof row[permissionsIndex] !== "string" ||
        row[permissionsIndex] === ""
      ) {
        continue;
      }

      await this.store.setUserModuleAccess(
        userId,
        parseSessionPermissions(row[permissionsIndex]),
      );
    }
  }

  protected override async afterSessionSave(sourceTable: Table) {
    if (sourceTable.name === "users") await this.reconcile();
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
    const username = requiredString(params, "username");
    await this.assertUsernameIsUnique(username);
    await this.store.addUser({
      email: optionalString(params, "email"),
      emailVerified: optionalBoolean(params, "emailVerified"),
      enabled: optionalBoolean(params, "enabled"),
      firstName: optionalString(params, "firstName"),
      lastName: optionalString(params, "lastName"),
      temporary_password: optionalString(params, "temporary_password"),
      username,
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
    const username = optionalString(params, "username");
    if (username) await this.assertUsernameIsUnique(username, userId);
    await this.store.updateUser({
      email: optionalString(params, "email"),
      emailVerified: optionalBoolean(params, "emailVerified"),
      enabled: optionalBoolean(params, "enabled"),
      firstName: optionalString(params, "firstName"),
      lastName: optionalString(params, "lastName"),
      temporary_password: optionalString(params, "temporary_password"),
      userId,
      username,
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
      const [options, snapshot] = await Promise.all([
        this.store.getUserModuleAccessOptions(requiredString(params, "userId")),
        this.store.snapshot(),
      ]);
      const groupDisplayNames = new Map(
        snapshot.groups.map(({ groupDisplayName, id, name }) => [
          id,
          resolveDisplayName(name, groupDisplayName),
        ]),
      );
      const roleDisplayNames = new Map(
        snapshot.clientRoles.map(({ role }) => [
          role.id,
          resolveDisplayName(role.name, role.roleDisplayName),
        ]),
      );
      return {
        data: {
          modules: options.modules.map(({ groups, ...module }) => ({
            ...module,
            groups: groups.map((group) => ({
              ...group,
              groupDisplayName:
                groupDisplayNames.get(group.groupId) ??
                resolveDisplayName(group.groupName),
              roleDisplayName:
                roleDisplayNames.get(group.roleId) ??
                resolveDisplayName(group.roleName),
            })),
          })),
        },
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

  private async assertUsernameIsUnique(username: string, userId?: string) {
    const normalizedUsername = username.toLocaleLowerCase();
    const existingUser = (await this.store.snapshot()).users.find(
      (user) =>
        user.id !== userId &&
        user.username.toLocaleLowerCase() === normalizedUsername,
    );
    if (existingUser) throw new Error("username must be unique");
  }
}

export const userAdminModule = new UserAdminModule();
