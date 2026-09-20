export const MODULE_PERMISSIONS_COLUMN = "permissions";

export interface ModulePermission {
  clientIdentifier: string;
  groupIds: readonly string[];
  loginRole: string;
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
        (byLoginRole, { clientIdentifier, groupIds, loginRole }) => {
          const existing = byLoginRole.get(loginRole);
          byLoginRole.set(loginRole, {
            clientIdentifier:
              clientIdentifier || existing?.clientIdentifier || "",
            groupIds: [...(existing?.groupIds ?? []), ...groupIds],
            loginRole,
          });
          return byLoginRole;
        },
        new Map<string, ModulePermission>(),
      ).values(),
    )
      .map(({ clientIdentifier, groupIds, loginRole }) =>
        Object.freeze({
          clientIdentifier,
          groupIds: normalizeGroupIds(groupIds),
          loginRole,
        }),
      )
      .sort((left, right) => left.loginRole.localeCompare(right.loginRole)),
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
          application.loginRole === other.applications[index].loginRole &&
          sameValues(
            application.groupIds,
            other.applications[index].groupIds,
          ),
      )
    );
  }

  groupIdsFor(loginRole: string) {
    return (
      this.applications.find(
        (application) => application.loginRole === loginRole,
      )?.groupIds ?? []
    );
  }

  hasApplication(loginRole: string) {
    return this.applications.some(
      (application) => application.loginRole === loginRole,
    );
  }

  toJSON() {
    return this.applications.map(
      ({ clientIdentifier, groupIds, loginRole }) => ({
        clientIdentifier,
        groupIds: [...groupIds],
        loginRole,
      }),
    );
  }

  withSelectedModules(
    selectedModules: readonly ModulePermissionSelection[],
    managedLoginRoles: readonly string[],
  ) {
    const managedLoginRoleSet = new Set(managedLoginRoles);
    const unmanagedApplications = this.applications.filter(
      ({ loginRole }) => !managedLoginRoleSet.has(loginRole),
    );
    return new ModulePermissions(
      unmanagedApplications.concat(
        selectedModules.map(
          ({
            clientIdentifier,
            defaultPermission,
            name: loginRole,
            selectedPermissions,
          }) => {
            const existing = this.applications.find(
              (application) => application.loginRole === loginRole,
            );
            return {
              clientIdentifier:
                clientIdentifier ?? existing?.clientIdentifier ?? "",
              groupIds:
                selectedPermissions.length > 0
                  ? selectedPermissions
                  : existing?.groupIds ??
                    (defaultPermission ? [defaultPermission] : []),
              loginRole,
            };
          },
        ),
      ),
    );
  }
}
