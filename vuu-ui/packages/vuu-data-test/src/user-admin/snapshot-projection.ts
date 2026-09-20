import type {
  UserAdminSnapshot,
  UserAdminTableName,
} from "@heswell/user-admin/contracts";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import type { Table } from "../Table";

type Row = Array<bigint | VuuRowDataItemType>;
type Tables = Record<UserAdminTableName, Table>;

const rowsEqual = (left: Row, right: Row) =>
  left.length === right.length &&
  left.every((value, index) => value === right[index]);

const membershipId = (userId: string, groupId: string) =>
  `${userId}:${groupId}`;

const assignmentId = (groupId: string, roleId: string) =>
  `${groupId}:${roleId}`;

export const resolveDisplayName = (
  name: string,
  configuredDisplayName?: string,
) => configuredDisplayName ?? name.split("-").at(-1) ?? name;

const groupDisplayName = ({
  groupDisplayName: configuredDisplayName,
  name,
}: UserAdminSnapshot["groups"][number]) =>
  resolveDisplayName(name, configuredDisplayName);

const roleDisplayName = ({
  roleDisplayName: configuredDisplayName,
  name,
}: UserAdminSnapshot["clientRoles"][number]["role"]) =>
  resolveDisplayName(name, configuredDisplayName);

const systemValues = (timestamp: number) => ({
  vuuCreatedTimestamp: timestamp,
  vuuMsg: "",
  vuuUpdatedTimestamp: timestamp,
});

const toRow = (table: Table, values: Record<string, VuuRowDataItemType>) =>
  table.schema.columns.map(
    ({ name }) => values[name] ?? "",
  ) as VuuRowDataItemType[];

const userRoleIds = (snapshot: UserAdminSnapshot, userId: string) => {
  const groupIds = new Set(
    snapshot.userGroups
      .filter(({ user }) => user.id === userId)
      .map(({ group }) => group.id),
  );
  return new Set(
    snapshot.groupRoles
      .filter(({ group }) => groupIds.has(group.id))
      .map(({ role }) => role.id),
  );
};

const moduleAccessRoles = (snapshot: UserAdminSnapshot, userId: string) =>
  Array.from(
    new Set(
      snapshot.groupRoles
        .filter(
          ({ group, role }) =>
            snapshot.userGroups.some(
              ({ user, group: userGroup }) =>
                user.id === userId && userGroup.id === group.id,
            ) && role.name.endsWith("-access"),
        )
        .map(({ role }) => role.name),
    ),
  ).sort();

export const projectUserAdminSnapshot = (
  snapshot: UserAdminSnapshot,
  tables: Tables,
): Record<UserAdminTableName, Row[]> => {
  const system = systemValues(snapshot.timestamp);
  const membershipRows = snapshot.userGroups.map(({ user, group }) => ({
    group,
    membership_id: membershipId(user.id, group.id),
    user,
  }));
  const assignmentRows = snapshot.groupRoles.map(({ client, group, role }) => ({
    assignment_id: assignmentId(group.id, role.id),
    client,
    group,
    role,
  }));

  return {
    users: snapshot.users.map((user) => {
      const accessRoles = moduleAccessRoles(snapshot, user.id);
      return toRow(tables.users, {
        ...system,
        email: user.email ?? "",
        email_verified: user.emailVerified ?? false,
        enabled: user.enabled ?? true,
        first_name: user.firstName ?? "",
        group_count: snapshot.userGroups.filter(
          ({ user: member }) => member.id === user.id,
        ).length,
        last_login: 0,
        last_name: user.lastName ?? "",
        module_access: accessRoles.join(","),
        module_access_count: accessRoles.length,
        password_update_required:
          user.requiredActions?.includes("UPDATE_PASSWORD") ?? false,
        role_count: userRoleIds(snapshot, user.id).size,
        user_id: user.id,
        username: user.username,
      });
    }),
    groups: snapshot.groups.map((group) =>
      toRow(tables.groups, {
        ...system,
        group_display_name: groupDisplayName(group),
        group_id: group.id,
        group_path: group.path ?? `/${group.name}`,
        parent_group_id: group.parentId ?? "",
        role_count: snapshot.groupRoles.filter(
          ({ group: assignmentGroup }) => assignmentGroup.id === group.id,
        ).length,
        user_count: snapshot.userGroups.filter(
          ({ group: memberGroup }) => memberGroup.id === group.id,
        ).length,
      }),
    ),
    clients: snapshot.clients.map((client) =>
      toRow(tables.clients, {
        ...system,
        client_id: client.id,
        client_identifier: client.clientId,
        client_name: client.name ?? "",
        description: client.description ?? "",
        enabled: client.enabled ?? true,
      }),
    ),
    roles: snapshot.clientRoles.map(({ client, role }) =>
      toRow(tables.roles, {
        ...system,
        client_id: role.containerId ?? client.id,
        client_identifier: client.clientId,
        client_name: client.name ?? "",
        description: role.description ?? "",
        group_count: snapshot.groupRoles.filter(
          ({ role: groupRole }) => groupRole.id === role.id,
        ).length,
        role_id: role.id,
        role_display_name: roleDisplayName(role),
        role_name: role.name,
        user_count: new Set(
          snapshot.userGroups
            .filter(({ group }) =>
              snapshot.groupRoles.some(
                ({ group: roleGroup, role: groupRole }) =>
                  group.id === roleGroup.id && groupRole.id === role.id,
              ),
            )
            .map(({ user }) => user.id),
        ).size,
      }),
    ),
    user_groups: membershipRows.map(({ group, membership_id, user }) =>
      toRow(tables.user_groups, {
        ...system,
        group_display_name: groupDisplayName(group),
        group_id: group.id,
        group_name: group.name,
        group_path: group.path ?? `/${group.name}`,
        membership_id,
        user_id: user.id,
        username: user.username,
      }),
    ),
    group_roles: assignmentRows.map(({ assignment_id, client, group, role }) =>
      toRow(tables.group_roles, {
        ...system,
        assignment_id,
        client_id: client?.id ?? "",
        client_identifier: client?.clientId ?? "",
        client_name: client?.name ?? "",
        group_id: group.id,
        group_display_name: groupDisplayName(group),
        group_name: group.name,
        role_id: role.id,
        role_display_name: roleDisplayName(role),
        role_name: role.name,
      }),
    ),
    user_group_roles: membershipRows.flatMap(({ group, membership_id, user }) =>
      assignmentRows
        .filter(({ group: assignmentGroup }) => assignmentGroup.id === group.id)
        .map(({ assignment_id, client, role }) =>
          toRow(tables.user_group_roles, {
            ...system,
            assignment_id,
            client_id: client?.id ?? "",
            client_identifier: client?.clientId ?? "",
            client_name: client?.name ?? "",
            email: user.email ?? "",
            email_verified: user.emailVerified ?? false,
            enabled: user.enabled ?? true,
            first_name: user.firstName ?? "",
            group_id: group.id,
            group_display_name: groupDisplayName(group),
            group_name: group.name,
            group_path: group.path ?? `/${group.name}`,
            id: `${membership_id}:${assignment_id}`,
            last_login: 0,
            last_name: user.lastName ?? "",
            membership_id,
            password_update_required:
              user.requiredActions?.includes("UPDATE_PASSWORD") ?? false,
            role_id: role.id,
            role_display_name: roleDisplayName(role),
            role_name: role.name,
            user_id: user.id,
            username: user.username,
          }),
        ),
    ),
  };
};

export const reconcileUserAdminTables = (
  snapshot: UserAdminSnapshot,
  tables: Tables,
) => {
  const projected = projectUserAdminSnapshot(snapshot, tables);

  for (const tableName of Object.keys(tables) as UserAdminTableName[]) {
    const table = tables[tableName];
    const desiredRows = projected[tableName];
    const keyIndex = table.map[table.schema.key];
    const desiredKeys = new Set(
      desiredRows.map((row) => String(row[keyIndex])),
    );

    for (const existingRow of [...table.data]) {
      const key = String(existingRow[keyIndex]);
      if (!desiredKeys.has(key)) {
        table.delete(key);
      }
    }

    for (const row of desiredRows) {
      const key = String(row[keyIndex]);
      const existingRow = table.findByKey(key);
      if (existingRow === undefined) {
        table.insert(row);
      } else if (!rowsEqual(existingRow, row)) {
        table.updateRow(row);
      }
    }
  }
};
