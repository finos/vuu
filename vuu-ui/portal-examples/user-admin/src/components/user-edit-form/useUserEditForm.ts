import { usePortalModuleRegistry } from "@vuu-ui/core/portal";
import type { EditSession } from "@vuu-ui/vuu-data-editing";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  loadUserModuleAccess,
  type ModuleAccessGroup,
  type UserModuleAccess,
} from "../../data/module-access";
import type {
  ModulePickerModuleDescriptor,
  SelectedModulesChangeHandler,
} from "../module-picker/ModulePicker";
import {
  ModulePermissions,
  MODULE_PERMISSIONS_COLUMN,
} from "./ModulePermissions";

const permissionDescriptor = ({
  groupId,
  groupName,
  groupPath,
  privilege,
}: ModuleAccessGroup) => ({
  label: [groupName, groupPath, privilege].filter(Boolean).join(" · "),
  name: groupId,
});

export const useUserEditForm = (
  dataRow: DataRow,
  dataSource: DataSource,
  editSession: EditSession,
) => {
  const { remoteModules } = usePortalModuleRegistry();
  const [moduleAccess, setModuleAccess] = useState<UserModuleAccess>();
  const [modulePermissions, setModulePermissions] =
    useState<ModulePermissions>();
  const originalModulePermissionsRef = useRef<ModulePermissions | undefined>(
    undefined,
  );

  useEffect(() => {
    const userId = dataRow?.user_id;
    if (typeof userId !== "string") {
      console.error("User editor cannot load module access without a user ID.");
      return;
    }

    let active = true;
    setModuleAccess(undefined);
    void loadUserModuleAccess(dataSource, userId)
      .then((access) => {
        if (active) {
          const original = new ModulePermissions(
            access.assignments.map(({ groupId, loginRole }) => ({
              clientIdentifier:
                remoteModules.find((module) => module.loginRole === loginRole)
                  ?.clientIdentifier ?? "",
              groupIds: [groupId],
              loginRole,
            })),
          );
          setModuleAccess(access);
          setModulePermissions(original);
          originalModulePermissionsRef.current = original;
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          console.error("User editor failed to load module access:", cause);
        }
      });

    return () => {
      active = false;
    };
  }, [dataRow, dataRow?.user_id, dataSource, remoteModules]);

  const allModules = useMemo<ModulePickerModuleDescriptor[]>(
    () =>
      remoteModules.map(({ loginRole, title }) => {
        const module = moduleAccess?.modules.find(
          (candidate) => candidate.loginRole === loginRole,
        );
        const selectedGroupId = moduleAccess?.assignments.find(
          (assignment) => assignment.loginRole === loginRole,
        )?.groupId;
        return {
          clientIdentifier: remoteModules.find(
            (remoteModule) => remoteModule.loginRole === loginRole,
          )?.clientIdentifier,
          defaultPermission: module?.groups.find(
            ({ isDefault }) => isDefault,
          )?.groupId,
          label: title,
          name: loginRole,
          permissions: module?.groups.map(permissionDescriptor) ?? [],
          selectedPermissions: selectedGroupId ? [selectedGroupId] : [],
        };
      }),
    [moduleAccess, remoteModules],
  );

  const handleSelectedModulesChange = useCallback<SelectedModulesChangeHandler>(
    (newSelectedModules) => {
      const originalModulePermissions = originalModulePermissionsRef.current;
      if (!modulePermissions || !originalModulePermissions) return;
      const updatedPermissions = modulePermissions.withSelectedModules(
        newSelectedModules,
        allModules.map(({ name }) => name),
      );
      const nextPermissions = updatedPermissions.equals(
        originalModulePermissions,
      )
        ? originalModulePermissions
        : updatedPermissions;

      void editSession
        .commit(
          dataRow.key,
          MODULE_PERMISSIONS_COLUMN,
          originalModulePermissions,
          nextPermissions,
          true,
          {
            dataSourceValue: JSON.stringify(nextPermissions.toJSON()),
          },
        )
        .then(() => {
          setModulePermissions(nextPermissions);
        })
        .catch((cause: unknown) => {
          console.error("User editor failed to update module permissions:", cause);
        });
    },
    [allModules, dataRow, editSession, modulePermissions],
  );

  const resetModulePermissions = useCallback(() => {
    const originalModulePermissions = originalModulePermissionsRef.current;
    if (!originalModulePermissions) return;
    setModulePermissions(originalModulePermissions);
  }, []);

  return {
    allModules,
    modulePermissions,
    onSelectedModulesChange: handleSelectedModulesChange,
    resetModulePermissions,
  };
};
