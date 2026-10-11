import { usePortalModuleRegistry } from "@vuu-ui/core/portal";
import { useCustomEditField } from "@vuu-ui/vuu-data-editing";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import { NotificationType, useNotifications } from "@vuu-ui/vuu-notifications";
import { useCallback, useEffect, useMemo, useState } from "react";
import { errorMessage } from "../../data/admin-contract";
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
  groupDisplayName,
}: ModuleAccessGroup) => ({
  label: groupDisplayName,
  name: groupId,
});

const equalPermissions = (a: ModulePermissions, b: ModulePermissions) =>
  a.equals(b);
const serializePermissions = (permissions: ModulePermissions) =>
  JSON.stringify(permissions.toJSON());

/**
 * Loads the user's module permissions and edits them as a custom field of the
 * enclosing form's edit session, so changes are saved, or discarded, with the
 * form's other fields.
 */
export const useUserEditForm = (dataRow: DataRow, dataSource: DataSource) => {
  const { remoteModules } = usePortalModuleRegistry();
  const { showNotification } = useNotifications();
  const [moduleAccess, setModuleAccess] = useState<UserModuleAccess>();
  const [originalModulePermissions, setOriginalModulePermissions] =
    useState<ModulePermissions>();
  const notifyFailure = useCallback(
    (header: string, cause: unknown) => {
      showNotification({
        type: NotificationType.Toast,
        status: "error",
        header,
        content: errorMessage(cause),
      });
    },
    [showNotification],
  );

  useEffect(() => {
    const userId = dataRow.user_id;
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
            access.assignments.map(({ groupId, accessRole }) => ({
              clientIdentifier:
                remoteModules.find((module) => module.accessRole === accessRole)
                  ?.clientIdentifier ?? "",
              groupIds: [groupId],
              accessRole,
            })),
          );
          setModuleAccess(access);
          setOriginalModulePermissions(original);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          console.error("User editor failed to load module access:", cause);
          notifyFailure("Unable to load user permissions", cause);
        }
      });

    return () => {
      active = false;
    };
  }, [dataRow, dataSource, notifyFailure, remoteModules]);

  const allModules = useMemo<ModulePickerModuleDescriptor[]>(
    () =>
      remoteModules.map(({ accessRole, title }) => {
        const module = moduleAccess?.modules.find(
          (candidate) => candidate.accessRole === accessRole,
        );
        return {
          clientIdentifier: remoteModules.find(
            (remoteModule) => remoteModule.accessRole === accessRole,
          )?.clientIdentifier,
          defaultPermission: module?.groups.find(({ isDefault }) => isDefault)
            ?.groupId,
          label: title,
          name: accessRole,
          permissions: module?.groups.map(permissionDescriptor) ?? [],
          selectedPermissions: module?.selectedGroupIds ?? [],
        };
      }),
    [moduleAccess, remoteModules],
  );

  const { setValue, value: modulePermissions } =
    useCustomEditField<ModulePermissions>({
      equals: equalPermissions,
      name: MODULE_PERMISSIONS_COLUMN,
      onError: (cause) =>
        notifyFailure("Unable to update user permissions", cause),
      originalValue: originalModulePermissions,
      rowKey: dataRow.key,
      serialize: serializePermissions,
    });

  const handleSelectedModulesChange = useCallback<SelectedModulesChangeHandler>(
    (newSelectedModules) => {
      if (modulePermissions) {
        void setValue(
          modulePermissions.withSelectedModules(
            newSelectedModules,
            allModules.map(({ name }) => name),
          ),
        );
      }
    },
    [allModules, modulePermissions, setValue],
  );

  return {
    allModules,
    modulePermissions,
    onSelectedModulesChange: handleSelectedModulesChange,
  };
};
