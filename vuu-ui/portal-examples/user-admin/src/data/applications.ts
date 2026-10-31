import type { RemoteModuleDescriptor } from "@vuu-ui/core/portal";
import type { Filter } from "@vuu-ui/vuu-filter-types";

/**
 * Applications are never stored. They are derived on every load from the
 * portal module descriptors plus the Keycloak data published in USER_ADMIN:
 *
 * - `accessRole` names the single access role owned by the vuu-portal client.
 * - `clientIdentifier` names the application's own client, which owns its roles.
 * - The access role minus its `-access` suffix is the group-name prefix, so
 *   `basket-trading-access` owns groups named `basket-trading-*`.
 */
export const ACCESS_ROLE_SUFFIX = "-access";
export const PORTAL_CLIENT_IDENTIFIER = "vuu-portal";
/** Selection value for groups and roles that match no application. */
export const UNASSIGNED = "__unassigned__";

export interface PortalApplication {
  accessRole: string;
  clientIdentifier: string;
  description?: string;
  groupPrefix: string;
  name: string;
  navIconName?: string;
  navIconUrl?: string;
  title: string;
}

export type HealthIssueCode =
  | "invalid-access-role"
  | "duplicate-application"
  | "ambiguous-prefix"
  | "missing-access-role"
  | "missing-client"
  | "no-groups"
  | "group-missing-access-role"
  | "group-foreign-roles"
  | "unused-role"
  | "unmatched-group"
  | "unmatched-role";

export interface HealthIssue {
  /** Name of the affected application, when there is one. */
  application?: string;
  code: HealthIssueCode;
  message: string;
}

type ApplicationSource = Pick<
  RemoteModuleDescriptor,
  "accessRole" | "clientIdentifier" | "name" | "title"
> &
  Partial<
    Pick<RemoteModuleDescriptor, "description" | "navIconName" | "navIconUrl">
  >;

export const groupPrefixFor = (accessRole: string) =>
  accessRole.endsWith(ACCESS_ROLE_SUFFIX) &&
  accessRole.length > ACCESS_ROLE_SUFFIX.length
    ? `${accessRole.slice(0, -ACCESS_ROLE_SUFFIX.length)}-`
    : undefined;

export const deriveApplications = (
  modules: readonly ApplicationSource[],
): { applications: PortalApplication[]; issues: HealthIssue[] } => {
  const issues: HealthIssue[] = [];
  const byAccessRole = new Map<string, PortalApplication>();

  for (const module of modules) {
    const title = module.title || module.name;
    const groupPrefix = groupPrefixFor(module.accessRole);
    if (!groupPrefix) {
      issues.push({
        application: module.name,
        code: "invalid-access-role",
        message: `${title} has access role "${module.accessRole}", which does not end with "${ACCESS_ROLE_SUFFIX}".`,
      });
      continue;
    }
    if (byAccessRole.has(module.accessRole)) {
      issues.push({
        application: module.name,
        code: "duplicate-application",
        message: `${title} reuses access role "${module.accessRole}" from ${byAccessRole.get(module.accessRole)?.title}.`,
      });
      continue;
    }
    byAccessRole.set(module.accessRole, {
      accessRole: module.accessRole,
      clientIdentifier: module.clientIdentifier,
      description: module.description || undefined,
      groupPrefix,
      name: module.name,
      navIconName: module.navIconName,
      navIconUrl: module.navIconUrl,
      title,
    });
  }

  const applications = [...byAccessRole.values()].sort((left, right) =>
    left.title.localeCompare(right.title),
  );

  for (const application of applications) {
    for (const other of applications) {
      if (
        other !== application &&
        other.groupPrefix.startsWith(application.groupPrefix)
      ) {
        issues.push({
          application: application.name,
          code: "ambiguous-prefix",
          message: `Group prefix "${application.groupPrefix}" of ${application.title} also matches ${other.title} groups ("${other.groupPrefix}"). Groups are assigned to the longest matching prefix.`,
        });
      }
    }
  }

  return { applications, issues };
};

/** Keycloak group paths end with the group name, e.g. `/vuu/basket-trading-read`. */
export const groupNameFromPath = (path: unknown) =>
  typeof path === "string" ? path.split("/").filter(Boolean).at(-1) : undefined;

export const applicationForGroupName = (
  applications: readonly PortalApplication[],
  groupName: string | undefined,
) => {
  if (!groupName) return undefined;
  let match: PortalApplication | undefined;
  for (const application of applications) {
    if (
      groupName.length > application.groupPrefix.length &&
      groupName.startsWith(application.groupPrefix) &&
      (!match || application.groupPrefix.length > match.groupPrefix.length)
    ) {
      match = application;
    }
  }
  return match;
};

export const groupSuffixFor = (
  application: PortalApplication,
  groupName: string,
) =>
  groupName.startsWith(application.groupPrefix)
    ? groupName.slice(application.groupPrefix.length)
    : groupName;

export type RoleKind = "access" | "application";

export interface RoleClassification {
  application: PortalApplication;
  kind: RoleKind;
}

export const classifyRole = (
  applications: readonly PortalApplication[],
  roleName: unknown,
  clientIdentifier: unknown,
): RoleClassification | undefined => {
  if (clientIdentifier === PORTAL_CLIENT_IDENTIFIER) {
    const application = applications.find(
      ({ accessRole }) => accessRole === roleName,
    );
    return application ? { application, kind: "access" } : undefined;
  }
  const application = applications.find(
    (candidate) => candidate.clientIdentifier === clientIdentifier,
  );
  return application ? { application, kind: "application" } : undefined;
};

const assertFilterValue = (value: string) => {
  // Vuu's filter grammar has no escaped string literal syntax.
  if (/["\\\t\r\n]/.test(value)) {
    throw new Error(
      `"${value}" cannot be used in a filter: it contains a quote, backslash, tab or line break.`,
    );
  }
  return value;
};

/** Exact match against the comma-separated `users.module_access` column. */
export const moduleAccessFilter = (accessRole: string): Filter => {
  const value = assertFilterValue(accessRole);
  return {
    op: "or",
    filters: [
      { op: "=", column: "module_access", value },
      { op: "starts", column: "module_access", value: `${value},` },
      { op: "ends", column: "module_access", value: `,${value}` },
      { op: "contains", column: "module_access", value: `,${value},` },
    ],
  };
};

const NO_MATCH = "__no_match__";

/** Matches rows whose key is one of `ids`; an empty list matches nothing. */
export const idsFilter = (column: string, ids: readonly string[]): Filter =>
  ids.length === 0
    ? { op: "=", column, value: NO_MATCH }
    : { op: "in", column, values: ids.map(assertFilterValue) };

export interface GroupRow {
  readonly [column: string]: unknown;
  group_display_name?: unknown;
  group_id?: unknown;
  group_path?: unknown;
  user_count?: unknown;
}

export interface RoleRow {
  readonly [column: string]: unknown;
  client_identifier?: unknown;
  role_display_name?: unknown;
  role_id?: unknown;
  role_name?: unknown;
}

export interface GroupRoleRow {
  readonly [column: string]: unknown;
  group_id?: unknown;
  role_id?: unknown;
}

export interface ClientRow {
  readonly [column: string]: unknown;
  client_id?: unknown;
  client_identifier?: unknown;
  client_name?: unknown;
}

export interface ApplicationRole {
  clientIdentifier: string;
  displayName: string;
  groupCount: number;
  kind?: RoleKind;
  roleId: string;
  roleName: string;
}

export interface ApplicationGroup {
  displayName: string;
  /** Roles assigned to the group that belong to another, or no, application. */
  foreignRoles: ApplicationRole[];
  groupId: string;
  groupName: string;
  hasAccessRole: boolean;
  path: string;
  roleIds: string[];
  userCount: number;
}

export interface ApplicationClient {
  clientId: string;
  clientIdentifier: string;
  clientName: string;
}

export interface ApplicationDetails {
  accessRole?: ApplicationRole;
  application: PortalApplication;
  client?: ApplicationClient;
  groups: ApplicationGroup[];
  issues: HealthIssue[];
  /** Roles owned by the application's client (never the access role). */
  roles: ApplicationRole[];
}

export interface ApplicationModel {
  applications: ApplicationDetails[];
  byName: ReadonlyMap<string, ApplicationDetails>;
  /** Application name for each matched group ID. */
  groupApplication: ReadonlyMap<string, string>;
  groupsById: ReadonlyMap<string, ApplicationGroup>;
  /** Issues across all applications, including descriptor issues. */
  issues: HealthIssue[];
  /** Application name for each matched role ID. */
  roleApplication: ReadonlyMap<string, string>;
  rolesById: ReadonlyMap<string, ApplicationRole>;
  unmatchedGroups: ApplicationGroup[];
  unmatchedRoles: ApplicationRole[];
}

const text = (value: unknown) => (typeof value === "string" ? value : "");
const count = (value: unknown) =>
  typeof value === "number" ? value : Number(value) || 0;

export const buildApplicationModel = ({
  applications,
  clients,
  descriptorIssues = [],
  groupRoles,
  groups,
  roles,
}: {
  applications: readonly PortalApplication[];
  clients: readonly ClientRow[];
  descriptorIssues?: readonly HealthIssue[];
  groupRoles: readonly GroupRoleRow[];
  groups: readonly GroupRow[];
  roles: readonly RoleRow[];
}): ApplicationModel => {
  const roleIdsByGroup = new Map<string, string[]>();
  const groupCountByRole = new Map<string, number>();
  for (const row of groupRoles) {
    const groupId = text(row.group_id);
    const roleId = text(row.role_id);
    if (!groupId || !roleId) continue;
    roleIdsByGroup.set(groupId, [
      ...(roleIdsByGroup.get(groupId) ?? []),
      roleId,
    ]);
    groupCountByRole.set(roleId, (groupCountByRole.get(roleId) ?? 0) + 1);
  }

  const allRoles = roles.flatMap((row): ApplicationRole[] => {
    const roleId = text(row.role_id);
    const roleName = text(row.role_name);
    if (!roleId || !roleName) return [];
    const clientIdentifier = text(row.client_identifier);
    return [
      {
        clientIdentifier,
        displayName: text(row.role_display_name) || roleName,
        groupCount: groupCountByRole.get(roleId) ?? 0,
        kind: classifyRole(applications, roleName, clientIdentifier)?.kind,
        roleId,
        roleName,
      },
    ];
  });
  const rolesById = new Map(allRoles.map((role) => [role.roleId, role]));
  const roleApplication = new Map(
    allRoles.flatMap((role) => {
      const match = classifyRole(
        applications,
        role.roleName,
        role.clientIdentifier,
      );
      return match ? [[role.roleId, match.application.name] as const] : [];
    }),
  );

  const details = new Map<string, ApplicationDetails>(
    applications.map((application) => [
      application.name,
      {
        application,
        groups: [],
        issues: [],
        roles: [],
      },
    ]),
  );
  const unmatchedGroups: ApplicationGroup[] = [];
  const unmatchedRoles: ApplicationRole[] = [];
  const groupsById = new Map<string, ApplicationGroup>();
  const groupApplication = new Map<string, string>();

  for (const role of allRoles) {
    const applicationName = roleApplication.get(role.roleId);
    const entry = applicationName ? details.get(applicationName) : undefined;
    if (!entry) {
      unmatchedRoles.push(role);
    } else if (role.kind === "access") {
      entry.accessRole = role;
    } else {
      entry.roles.push(role);
    }
  }

  for (const row of groups) {
    const groupId = text(row.group_id);
    if (!groupId) continue;
    const path = text(row.group_path);
    const groupName = groupNameFromPath(path) ?? "";
    const application = applicationForGroupName(applications, groupName);
    const entry = application ? details.get(application.name) : undefined;
    const roleIds = roleIdsByGroup.get(groupId) ?? [];
    const group: ApplicationGroup = {
      displayName: text(row.group_display_name) || groupName,
      foreignRoles: roleIds.flatMap((roleId) => {
        if (application && roleApplication.get(roleId) === application.name) {
          return [];
        }
        const role = rolesById.get(roleId);
        return role ? [role] : [];
      }),
      groupId,
      groupName,
      hasAccessRole: entry?.accessRole
        ? roleIds.includes(entry.accessRole.roleId)
        : false,
      path,
      roleIds,
      userCount: count(row.user_count),
    };
    groupsById.set(groupId, group);
    if (entry && application) {
      entry.groups.push(group);
      groupApplication.set(groupId, application.name);
    } else {
      unmatchedGroups.push(group);
    }
  }

  const clientsByIdentifier = new Map(
    clients.map((row) => [
      text(row.client_identifier),
      {
        clientId: text(row.client_id),
        clientIdentifier: text(row.client_identifier),
        clientName: text(row.client_name),
      },
    ]),
  );

  const issues: HealthIssue[] = [...descriptorIssues];
  for (const entry of details.values()) {
    const { application } = entry;
    const issue = (code: HealthIssueCode, message: string) =>
      entry.issues.push({ application: application.name, code, message });
    entry.client = clientsByIdentifier.get(application.clientIdentifier);
    entry.groups.sort((left, right) =>
      left.groupName.localeCompare(right.groupName),
    );
    entry.roles.sort((left, right) =>
      left.roleName.localeCompare(right.roleName),
    );

    if (!entry.accessRole) {
      issue(
        "missing-access-role",
        `Access role "${application.accessRole}" was not found on the ${PORTAL_CLIENT_IDENTIFIER} client.`,
      );
    }
    if (!entry.client) {
      issue(
        "missing-client",
        `Client "${application.clientIdentifier}" was not found in Keycloak.`,
      );
    }
    if (entry.groups.length === 0) {
      issue(
        "no-groups",
        `No groups named "${application.groupPrefix}*" exist, so no user can be given access.`,
      );
    }
    for (const group of entry.groups) {
      if (entry.accessRole && !group.hasAccessRole) {
        issue(
          "group-missing-access-role",
          `Group "${group.groupName}" does not include access role "${application.accessRole}", so its members cannot open ${application.title}.`,
        );
      }
      if (group.foreignRoles.length > 0) {
        issue(
          "group-foreign-roles",
          `Group "${group.groupName}" includes roles from outside ${application.title}: ${group.foreignRoles.map(({ roleName }) => roleName).join(", ")}.`,
        );
      }
    }
    for (const role of entry.roles) {
      if (role.groupCount === 0) {
        issue(
          "unused-role",
          `Role "${role.roleName}" is not in any group, so it grants nothing.`,
        );
      }
    }
    issues.push(...entry.issues);
  }

  for (const group of unmatchedGroups) {
    issues.push({
      code: "unmatched-group",
      message: `Group "${group.groupName || group.groupId}" does not match any application group prefix.`,
    });
  }
  for (const role of unmatchedRoles) {
    issues.push({
      code: "unmatched-role",
      message: `Role "${role.roleName}" on client "${role.clientIdentifier}" does not belong to any application.`,
    });
  }

  const applicationDetails = applications.flatMap((application) => {
    const entry = details.get(application.name);
    return entry ? [entry] : [];
  });

  return {
    applications: applicationDetails,
    byName: new Map(
      applicationDetails.map((entry) => [entry.application.name, entry]),
    ),
    groupApplication,
    groupsById,
    issues,
    roleApplication,
    rolesById,
    unmatchedGroups,
    unmatchedRoles,
  };
};

/** Group IDs for an application, or for groups matching no application. */
export const groupIdsFor = (
  model: ApplicationModel,
  applicationName: string | typeof UNASSIGNED,
) =>
  (applicationName === UNASSIGNED
    ? model.unmatchedGroups
    : (model.byName.get(applicationName)?.groups ?? [])
  ).map(({ groupId }) => groupId);

/** Role IDs (access role first) for an application, or for unmatched roles. */
export const roleIdsFor = (
  model: ApplicationModel,
  applicationName: string | typeof UNASSIGNED,
) => {
  if (applicationName === UNASSIGNED) {
    return model.unmatchedRoles.map(({ roleId }) => roleId);
  }
  const entry = model.byName.get(applicationName);
  return entry
    ? [
        ...(entry.accessRole ? [entry.accessRole.roleId] : []),
        ...entry.roles.map(({ roleId }) => roleId),
      ]
    : [];
};
