export const MODULE_PERMISSIONS_COLUMN = "permissions";

export interface ModulePermission {
  clientIdentifier: string;
  groupIds: readonly string[];
  accessRole: string;
}

export interface ModulePermissionSelection {
  clientIdentifier?: string;
  defaultPermission?: string;
  name: string;
  selectedPermissions: readonly string[];
}

const sameValues = (
  left: readonly string[],
  right: readonly string[],
) => left.length === right.length && left.every((value, index) => value === right[index]);

const normalizeGroupIds = (groupIds: readonly string[]) =>
  Object.freeze([...new Set(groupIds)].sort());

const normalizePermissions = (
  permissions: readonly ModulePermission[],
): readonly ModulePermission[] =>
  Object.freeze(
    Array.from(
      [...permissions].reduce(
        (byAccessRole, { clientIdentifier, groupIds, accessRole }) => {
          const existing = byAccessRole.get(accessRole);
          byAccessRole.set(accessRole, {
            clientIdentifier:
              clientIdentifier || existing?.clientIdentifier || "",
            groupIds: [...(existing?.groupIds ?? []), ...groupIds],
            accessRole,
          });
          return byAccessRole;
        },
        new Map<string, ModulePermission>(),
      ).values(),
    )
      .map(({ clientIdentifier, groupIds, accessRole }) =>
        Object.freeze({
          clientIdentifier,
          groupIds: normalizeGroupIds(groupIds),
          accessRole,
        }),
      )
      .sort((left, right) => left.accessRole.localeCompare(right.accessRole)),
  );

export class ModulePermissions {
  readonly applications: readonly ModulePermission[];

  constructor(applications: readonly ModulePermission[]) {
    this.applications = normalizePermissions(applications);
    Object.freeze(this);
  }

  equals(other: ModulePermissions) {
    return (
      this.applications.length === other.applications.length &&
      this.applications.every(
        (application, index) =>
          application.clientIdentifier ===
            other.applications[index].clientIdentifier &&
          application.accessRole === other.applications[index].accessRole &&
          sameValues(
            application.groupIds,
            other.applications[index].groupIds,
          ),
      )
    );
  }

  groupIdsFor(accessRole: string) {
    return (
      this.applications.find(
        (application) => application.accessRole === accessRole,
      )?.groupIds ?? []
    );
  }

  hasApplication(accessRole: string) {
    return this.applications.some(
      (application) => application.accessRole === accessRole,
    );
  }

  toJSON() {
    return this.applications.map(
      ({ clientIdentifier, groupIds, accessRole }) => ({
        clientIdentifier,
        groupIds: [...groupIds],
        accessRole,
      }),
    );
  }

  withSelectedModules(
    selectedModules: readonly ModulePermissionSelection[],
    managedAccessRoles: readonly string[],
  ) {
    const managedAccessRoleSet = new Set(managedAccessRoles);
    const unmanagedApplications = this.applications.filter(
      ({ accessRole }) => !managedAccessRoleSet.has(accessRole),
    );
    return new ModulePermissions(
      unmanagedApplications.concat(
        selectedModules.map(
          ({
            clientIdentifier,
            defaultPermission,
            name: accessRole,
            selectedPermissions,
          }) => {
            const existing = this.applications.find(
              (application) => application.accessRole === accessRole,
            );
            return {
              clientIdentifier:
                clientIdentifier ?? existing?.clientIdentifier ?? "",
              groupIds:
                selectedPermissions.length > 0
                  ? selectedPermissions
                  : existing
                    ? []
                    : defaultPermission
                      ? [defaultPermission]
                      : [],
              accessRole,
            };
          },
        ),
      ),
    );
  }
}
