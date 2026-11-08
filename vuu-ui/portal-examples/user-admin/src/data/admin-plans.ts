import type { AdminOperation } from "./admin-rpc";
import {
  type ApplicationDetails,
  type ApplicationGroup,
  type ApplicationModel,
  type ApplicationRole,
  PORTAL_CLIENT_IDENTIFIER,
} from "./applications";
import {
  type ModuleAccessAssignment,
  sortModuleAccessAssignments,
} from "./module-access";

/**
 * Pure planning for the two admin workflows. Each screen keeps a draft, and
 * these functions turn the difference between the saved state and the draft
 * into the RPCs that persist it.
 */

/** Keycloak group and role names are path segments. */
const INVALID_NAME = /[\s/]/;

/** A name without its application prefix, e.g. `basket-trading-read` → `read`. */
export const shortName = (name: string, prefix: string) =>
  name.startsWith(prefix) && name.length > prefix.length
    ? name.slice(prefix.length)
    : name;

/**
 * A group name with the part after its application prefix in upper case, e.g.
 * `basket-trading-read` → `basket-trading-READ`, so a group is never mistaken
 * for a role of the same name.
 */
export const groupDisplayName = (name: string, prefix: string) =>
  name.startsWith(prefix) && name.length > prefix.length
    ? `${prefix}${name.slice(prefix.length).toUpperCase()}`
    : name;

export const groupLabel = (
  entry: ApplicationDetails,
  group: ApplicationGroup,
) => groupDisplayName(group.groupName, entry.application.groupPrefix);

export const roleLabel = (entry: ApplicationDetails, role: ApplicationRole) =>
  shortName(role.roleName, entry.application.groupPrefix);

// ---------------------------------------------------------------------------
// Application workflow: groups and the roles they grant
// ---------------------------------------------------------------------------

/** Role IDs by group ID. */
export type GroupRoles = ReadonlyMap<string, ReadonlySet<string>>;

/** The saved role IDs of each of the application's groups. */
export const groupRolesFor = (entry: ApplicationDetails): GroupRoles =>
  new Map(entry.groups.map((group) => [group.groupId, new Set(group.roleIds)]));

export const toggleGroupRole = (
  draft: GroupRoles,
  groupId: string,
  roleId: string,
): GroupRoles => {
  const next = new Map(draft);
  const roles = new Set(next.get(groupId) ?? []);
  if (roles.has(roleId)) roles.delete(roleId);
  else roles.add(roleId);
  next.set(groupId, roles);
  return next;
};

/** The access role first, then the application's own roles. */
export const applicationRoles = (entry: ApplicationDetails) => [
  ...(entry.accessRole ? [entry.accessRole] : []),
  ...entry.roles,
];

const roleClient = (role: ApplicationRole) =>
  role.kind === "access" ? PORTAL_CLIENT_IDENTIFIER : role.clientIdentifier;

/** Assign/remove operations that turn `saved` into `draft`, for the application's own roles. */
export const groupRoleOperations = (
  entry: ApplicationDetails,
  saved: GroupRoles,
  draft: GroupRoles,
): AdminOperation[] => {
  const operations: AdminOperation[] = [];
  for (const group of entry.groups) {
    const before = saved.get(group.groupId) ?? new Set<string>();
    const after = draft.get(group.groupId) ?? new Set<string>();
    for (const role of applicationRoles(entry)) {
      const had = before.has(role.roleId);
      const has = after.has(role.roleId);
      if (had === has) continue;
      operations.push({
        label: `${has ? "Add" : "Remove"} ${role.roleName} ${has ? "to" : "from"} ${groupLabel(entry, group)}`,
        params: {
          clientId: roleClient(role),
          groupId: group.groupId,
          roleId: role.roleId,
        },
        rpcName: has ? "assignGroupRole" : "removeGroupRole",
      });
    }
  }
  return operations;
};

export const validateGroupSuffix = (
  model: ApplicationModel,
  entry: ApplicationDetails,
  suffix: string,
) => {
  if (!entry.accessRole) {
    return `Access role "${entry.application.accessRole}" was not found, so a ${entry.application.title} group would not grant access.`;
  } else if (!suffix) {
    return "Group name is required.";
  } else if (INVALID_NAME.test(suffix)) {
    return "Group names cannot contain spaces or slashes.";
  }
  const groupName = `${entry.application.groupPrefix}${suffix}`;
  if (
    [...model.groupsById.values()].some(
      (group) => group.groupName === groupName,
    )
  ) {
    return `A group named "${groupName}" already exists.`;
  }
};

export interface NewGroup {
  description?: string;
  /** Roles to include besides the access role, which is always included. */
  roleIds: readonly string[];
  suffix: string;
  /** Users to add to the group. */
  users: readonly UserRef[];
}

/**
 * Creates a group, then fills it. The create RPC returns no ID, so later
 * operations refer to the group by name.
 */
export const createGroupOperations = (
  entry: ApplicationDetails,
  { description, roleIds, suffix, users }: NewGroup,
): AdminOperation[] => {
  const groupName = `${entry.application.groupPrefix}${suffix}`;
  const roles = applicationRoles(entry).filter(
    (role) => role.kind === "access" || roleIds.includes(role.roleId),
  );
  return [
    {
      label: `Create group ${groupName}`,
      params: { name: groupName, ...(description ? { description } : {}) },
      rpcName: "addGroup",
    },
    ...roles.map<AdminOperation>((role) => ({
      label: `Add ${role.kind === "access" ? "access" : roleLabel(entry, role)} to ${groupName}`,
      params: { clientId: roleClient(role), groupName, roleId: role.roleId },
      rpcName: "assignGroupRole",
    })),
    ...users.map<AdminOperation>((user) => ({
      label: `Add ${user.username} to ${groupName}`,
      params: { groupName, userId: user.userId },
      rpcName: "assignUserToGroup",
    })),
  ];
};

export const validateRoleSuffix = (
  entry: ApplicationDetails,
  suffix: string,
) => {
  if (!entry.client) {
    return `Client "${entry.application.clientIdentifier}" was not found, so roles cannot be created for ${entry.application.title}.`;
  } else if (!suffix) {
    return "Role name is required.";
  } else if (INVALID_NAME.test(suffix)) {
    return "Role names cannot contain spaces or slashes.";
  }
  const roleName = `${entry.application.groupPrefix}${suffix}`;
  if (entry.roles.some((role) => role.roleName === roleName)) {
    return `A role named "${roleName}" already exists.`;
  }
};

/** Creates a role on the application's own client. */
export const createRoleOperation = (
  entry: ApplicationDetails,
  suffix: string,
  description = "",
): AdminOperation => {
  const name = `${entry.application.groupPrefix}${suffix}`;
  return {
    label: `Create role ${name}`,
    params: {
      clientId: entry.application.clientIdentifier,
      name,
      ...(description ? { description } : {}),
    },
    rpcName: "addClientRole",
  };
};

// ---------------------------------------------------------------------------
// Application workflow: which users are in which groups
// ---------------------------------------------------------------------------

export interface UserRef {
  userId: string;
  username: string;
}

/** Group IDs (of one application) by user ID. */
export type Memberships = ReadonlyMap<string, ReadonlySet<string>>;

export const membershipsFrom = (
  rows: readonly { group_id?: unknown; user_id?: unknown }[],
  groupIds: ReadonlySet<string>,
): Memberships => {
  const memberships = new Map<string, Set<string>>();
  for (const { group_id, user_id } of rows) {
    if (typeof user_id !== "string" || typeof group_id !== "string") continue;
    if (!groupIds.has(group_id)) continue;
    const groups = memberships.get(user_id) ?? new Set<string>();
    groups.add(group_id);
    memberships.set(user_id, groups);
  }
  return memberships;
};

const join = (user: UserRef, group: ApplicationGroup): AdminOperation => ({
  label: `Add ${user.username} to ${group.groupName}`,
  params: { groupId: group.groupId, userId: user.userId },
  rpcName: "assignUserToGroup",
});

const leave = (user: UserRef, group: ApplicationGroup): AdminOperation => ({
  label: `Remove ${user.username} from ${group.groupName}`,
  params: { groupId: group.groupId, userId: user.userId },
  rpcName: "removeUserFromGroup",
});

const isMember = (memberships: Memberships, user: UserRef, groupId: string) =>
  memberships.get(user.userId)?.has(groupId) ?? false;

/** Adds each user to each group they are not already in. */
export const addToGroupsOperations = (
  users: readonly UserRef[],
  groups: readonly ApplicationGroup[],
  memberships: Memberships,
) =>
  users.flatMap((user) =>
    groups.flatMap((group) =>
      isMember(memberships, user, group.groupId) ? [] : [join(user, group)],
    ),
  );

export const removeFromGroupOperations = (
  users: readonly UserRef[],
  group: ApplicationGroup,
  memberships: Memberships,
) =>
  users.flatMap((user) =>
    isMember(memberships, user, group.groupId) ? [leave(user, group)] : [],
  );

/** Puts each user in `group` and takes them out of the application's other groups. */
export const moveToGroupOperations = (
  entry: ApplicationDetails,
  users: readonly UserRef[],
  group: ApplicationGroup,
  memberships: Memberships,
) =>
  users.flatMap((user) => [
    ...(isMember(memberships, user, group.groupId) ? [] : [join(user, group)]),
    ...entry.groups.flatMap((other) =>
      other.groupId !== group.groupId &&
      isMember(memberships, user, other.groupId)
        ? [leave(user, other)]
        : [],
    ),
  ]);

/** Takes each user out of every group of the application. */
export const revokeAccessOperations = (
  entry: ApplicationDetails,
  users: readonly UserRef[],
  memberships: Memberships,
) =>
  users.flatMap((user) =>
    entry.groups.flatMap((group) =>
      isMember(memberships, user, group.groupId) ? [leave(user, group)] : [],
    ),
  );

/** Target groups, by user ID, for users whose groups have been changed. */
export type PendingGroups = ReadonlyMap<string, ReadonlySet<string>>;

const NO_GROUPS: ReadonlySet<string> = new Set();

const sameGroups = (left: ReadonlySet<string>, right: ReadonlySet<string>) =>
  left.size === right.size && [...left].every((groupId) => right.has(groupId));

/** A user's groups once pending changes are applied. */
export const pendingGroupsFor = (
  userId: string,
  pending: PendingGroups,
  memberships: Memberships,
): ReadonlySet<string> =>
  pending.get(userId) ?? memberships.get(userId) ?? NO_GROUPS;

export interface GroupSelection {
  /** Selected users who will be in the group. */
  count: number;
  state: "checked" | "mixed" | "unchecked";
}

/** How each group looks for the selected users. */
export const groupSelection = (
  entry: ApplicationDetails,
  userIds: readonly string[],
  pending: PendingGroups,
  memberships: Memberships,
): ReadonlyMap<string, GroupSelection> => {
  const groups = userIds.map((userId) =>
    pendingGroupsFor(userId, pending, memberships),
  );
  return new Map(
    entry.groups.map(({ groupId }) => {
      const count = groups.filter((g) => g.has(groupId)).length;
      const state =
        count === 0
          ? "unchecked"
          : count === groups.length
            ? "checked"
            : "mixed";
      return [groupId, { count, state }];
    }),
  );
};

/**
 * Puts every selected user in the group, or, when they are all in it already,
 * takes them all out. Their other groups are left as they are.
 */
export const toggleGroupFor = (
  entry: ApplicationDetails,
  userIds: readonly string[],
  groupId: string,
  pending: PendingGroups,
  memberships: Memberships,
): PendingGroups => {
  const join =
    groupSelection(entry, userIds, pending, memberships).get(groupId)?.state !==
    "checked";
  const next = new Map(pending);
  for (const userId of userIds) {
    const groups = new Set(pendingGroupsFor(userId, pending, memberships));
    if (join) groups.add(groupId);
    else groups.delete(groupId);
    if (sameGroups(groups, memberships.get(userId) ?? NO_GROUPS)) {
      next.delete(userId);
    } else {
      next.set(userId, groups);
    }
  }
  return next;
};

export type UserChange = "new" | "updated" | "revoked" | "unchanged";

/** What saving does to one user's access to the application. */
export const userChange = (
  entry: ApplicationDetails,
  userId: string,
  pending: PendingGroups,
  memberships: Memberships,
): UserChange => {
  const target = pending.get(userId);
  if (!target) return "unchanged";
  const current = memberships.get(userId) ?? NO_GROUPS;
  const access = accessGroups(entry);
  const hadAccess = access.some(({ groupId }) => current.has(groupId));
  const willHaveAccess = access.some(({ groupId }) => target.has(groupId));
  if (!hadAccess) return willHaveAccess ? "new" : "unchanged";
  if (!willHaveAccess) return "revoked";
  return sameGroups(current, target) ? "unchanged" : "updated";
};

/** Joins and leaves that give each user their pending groups. */
export const pendingGroupOperations = (
  entry: ApplicationDetails,
  users: readonly UserRef[],
  pending: PendingGroups,
  memberships: Memberships,
) =>
  users.flatMap((user) => {
    const target = pending.get(user.userId);
    if (!target) return [];
    return entry.groups.flatMap((group) => {
      const member = isMember(memberships, user, group.groupId);
      const wanted = target.has(group.groupId);
      return member === wanted
        ? []
        : [wanted ? join(user, group) : leave(user, group)];
    });
  });

/** Roles (excluding access) granted by membership of `groupIds`. */
export const rolesGrantedBy = (
  entry: ApplicationDetails,
  groupIds: Iterable<string>,
) => {
  const roleIds = new Set<string>();
  for (const groupId of groupIds) {
    for (const roleId of entry.groups.find((g) => g.groupId === groupId)
      ?.roleIds ?? []) {
      roleIds.add(roleId);
    }
  }
  return entry.roles.filter((role) => roleIds.has(role.roleId));
};

/** The application's least-privileged group: it grants access and the fewest other roles. */
export const leastPrivilegedGroup = (entry: ApplicationDetails) =>
  [...accessGroups(entry)].sort(
    (left, right) =>
      left.roleIds.length - right.roleIds.length ||
      left.groupName.localeCompare(right.groupName),
  )[0];

// ---------------------------------------------------------------------------
// User workflow: application access, as groups per application
// ---------------------------------------------------------------------------

/** Groups that grant access, i.e. those a user can be given. */
export const accessGroups = (entry: ApplicationDetails) =>
  entry.groups.filter((group) => group.hasAccessRole);

/** Selected group IDs by application access role. */
export type UserAccess = ReadonlyMap<string, ReadonlySet<string>>;

export const toggleAccessGroup = (
  access: UserAccess,
  accessRole: string,
  groupId: string,
): UserAccess => {
  const next = new Map(access);
  const groups = new Set(next.get(accessRole) ?? []);
  if (groups.has(groupId)) groups.delete(groupId);
  else groups.add(groupId);
  next.set(accessRole, groups);
  return next;
};

export const setAccessGroups = (
  access: UserAccess,
  accessRole: string,
  groupIds: Iterable<string>,
): UserAccess => new Map(access).set(accessRole, new Set(groupIds));

export const accessAssignments = (
  access: UserAccess,
): ModuleAccessAssignment[] =>
  sortModuleAccessAssignments(
    [...access].flatMap(([accessRole, groupIds]) =>
      [...groupIds].sort().map((groupId) => ({ accessRole, groupId })),
    ),
  );

export const sameAccess = (left: UserAccess, right: UserAccess) =>
  JSON.stringify(accessAssignments(left)) ===
  JSON.stringify(accessAssignments(right));

export interface AccessChange {
  accessRole: string;
  added: string[];
  removed: string[];
}

/** Per application, the group IDs added and removed. */
export const accessChanges = (
  saved: UserAccess,
  draft: UserAccess,
): AccessChange[] =>
  [...new Set([...saved.keys(), ...draft.keys()])].sort().flatMap((role) => {
    const before = saved.get(role) ?? new Set<string>();
    const after = draft.get(role) ?? new Set<string>();
    const added = [...after].filter((id) => !before.has(id));
    const removed = [...before].filter((id) => !after.has(id));
    return added.length || removed.length
      ? [{ accessRole: role, added, removed }]
      : [];
  });

/** Replaces the user's application groups in one RPC. */
export const userAccessOperation = (
  user: UserRef,
  access: UserAccess,
): AdminOperation => ({
  label: `Update application access for ${user.username}`,
  params: {
    assignments: JSON.stringify(accessAssignments(access)),
    userId: user.userId,
  },
  rpcName: "setUserModuleAccess",
});

export interface UserDetails {
  email: string;
  enabled: boolean;
  firstName: string;
  lastName: string;
  temporaryPassword?: string;
  username: string;
}

const USERNAME = /^[A-Za-z0-9._@-]+$/;
const EMAIL = /^[^\s@]+@[^\s@]+$/;

export type UserDetailsErrors = Partial<Record<keyof UserDetails, string>>;

export const validateUserDetails = (
  details: UserDetails,
  { isNew }: { isNew: boolean },
): UserDetailsErrors => {
  const errors: UserDetailsErrors = {};
  if (isNew) {
    if (!details.username) errors.username = "Username is required.";
    else if (!USERNAME.test(details.username))
      errors.username =
        "Use letters, numbers, dots, dashes, underscores or @ only.";
  }
  if (!details.email) errors.email = "Email is required.";
  else if (!EMAIL.test(details.email))
    errors.email = "Enter a valid email address.";
  return errors;
};

const userFields = (details: UserDetails) => ({
  email: details.email,
  enabled: details.enabled,
  firstName: details.firstName,
  lastName: details.lastName,
  ...(details.temporaryPassword
    ? { temporary_password: details.temporaryPassword }
    : {}),
});

/**
 * Creates a user, then adds them to the selected groups. The create RPC
 * returns no ID, so memberships refer to the user by username.
 */
export const createUserOperations = (
  model: ApplicationModel,
  details: UserDetails,
  access: UserAccess,
): AdminOperation[] => [
  {
    label: `Create user ${details.username}`,
    params: { username: details.username, ...userFields(details) },
    rpcName: "addUser",
  },
  ...accessAssignments(access).map<AdminOperation>(({ groupId }) => ({
    label: `Add ${details.username} to ${model.groupsById.get(groupId)?.groupName ?? groupId}`,
    params: { groupId, username: details.username },
    rpcName: "assignUserToGroup",
  })),
];

export const updateUserOperation = (
  userId: string,
  details: UserDetails,
): AdminOperation => ({
  label: `Update ${details.username}`,
  params: { userId, ...userFields(details) },
  rpcName: "updateUser",
});
