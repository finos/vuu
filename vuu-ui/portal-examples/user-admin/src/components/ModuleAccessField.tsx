import {
  FormField,
  FormFieldHelperText,
  FormFieldLabel,
  ListBox,
  Option,
} from "@salt-ds/core";
import { usePortalModuleRegistry } from "@vuu-ui/core/portal";
import { ItemPicker, type ItemDescriptor } from "@vuu-ui/vuu-ui-controls";
import { useMemo, useState } from "react";
import { columnFor, type AdminRecord } from "../data/admin-contract";
import { useAdminConfig } from "../data/AdminDataContext";
import { resolveModuleAccessValues } from "./ModuleAccessCell";
import type {
  ModuleAccessAssignment,
  ModuleAccessModule,
  UserModuleAccess,
} from "../data/module-access";

export interface ModuleAccessFieldProps {
  access?: UserModuleAccess;
  assignments?: readonly ModuleAccessAssignment[];
  disabled?: boolean;
  error?: string;
  loading?: boolean;
  onChange?: (assignments: ModuleAccessAssignment[]) => void;
  record?: AdminRecord;
}

const assignmentFor = (
  assignments: readonly ModuleAccessAssignment[],
  loginRole: string,
) => assignments.find((assignment) => assignment.loginRole === loginRole);

const groupLabel = (group: ModuleAccessModule["groups"][number]) =>
  [group.groupName, group.groupPath, group.roleName, group.privilege]
    .filter(Boolean)
    .join(" · ");

export const ModuleAccessField = ({
  access,
  assignments,
  disabled = false,
  error,
  loading = false,
  onChange,
  record,
}: ModuleAccessFieldProps) => {
  const config = useAdminConfig();
  const { remoteModules } = usePortalModuleRegistry();
  const [selectionError, setSelectionError] = useState<string>();
  const allItems = useMemo<ItemDescriptor[]>(
    () =>
      remoteModules.map((module) => ({
        name: module.loginRole,
        label: module.title ?? module.name,
      })),
    [remoteModules],
  );
  const currentAssignments = assignments ?? [];
  const selectedItems = useMemo(
    () =>
      allItems.filter((item) =>
        currentAssignments.some(({ loginRole }) => loginRole === item.name),
      ),
    [allItems, currentAssignments],
  );
  const selectedModules = useMemo(
    () =>
      (access?.modules ?? []).filter((module) =>
        currentAssignments.some(
          ({ loginRole }) => loginRole === module.loginRole,
        ),
      ),
    [access?.modules, currentAssignments],
  );

  const changeSelection = (items: ItemDescriptor[]) => {
    setSelectionError(undefined);
    const selectedRoles = new Set(items.map(({ name }) => name));
    const next = currentAssignments.filter(({ loginRole }) =>
      selectedRoles.has(loginRole),
    );
    for (const item of items) {
      if (assignmentFor(next, item.name)) continue;
      const module = access?.modules.find(
        ({ loginRole }) => loginRole === item.name,
      );
      const defaultGroup =
        module?.groups.find(({ isDefault }) => isDefault) ??
        (module?.groups.length === 1 ? module.groups[0] : undefined);
      if (!defaultGroup) {
        setSelectionError(
          `No least-privileged group is available for ${item.label ?? item.name}.`,
        );
        return;
      }
      next.push({ loginRole: item.name, groupId: defaultGroup.groupId });
    }
    onChange?.(next);
  };

  const changeGroup = (loginRole: string, selected: string[]) => {
    const groupId = selected[0];
    if (!groupId) return;
    onChange?.(
      currentAssignments.map((assignment) =>
        assignment.loginRole === loginRole
          ? { ...assignment, groupId }
          : assignment,
      ),
    );
  };

  if (!access || !onChange) {
    const value = record?.[columnFor(config, "users", "module_access")];
    const values = resolveModuleAccessValues(value, remoteModules);
    return (
      <FormField disabled>
        <FormFieldLabel>Portal module access</FormFieldLabel>
        <ListBox
          aria-label="Remote module access"
          bordered={false}
          readOnly
          selected={[]}
        >
          {values.map((module) => (
            <Option key={module} value={module}>
              {module}
            </Option>
          ))}
        </ListBox>
        <FormFieldHelperText>
          {record
            ? "Module access is inherited from the user's groups."
            : "Save this user, then reopen it to edit portal module access."}
        </FormFieldHelperText>
      </FormField>
    );
  }

  return (
    <FormField disabled={disabled || loading || !record}>
      <FormFieldLabel>Portal module access</FormFieldLabel>
      {record ? (
        <>
          {loading ? <p role="status">Loading module access...</p> : null}
          {error ? <p role="alert">{error}</p> : null}
          {access ? (
            <>
              <ItemPicker
                allItems={allItems}
                aria-label="Portal modules"
                itemTypeName="remote module"
                searchForm={false}
                selectedItems={selectedItems}
                onSelectedItemsChange={changeSelection}
              />
              {selectedModules.map((module) => {
                const assignment = assignmentFor(
                  currentAssignments,
                  module.loginRole,
                );
                return (
                  <FormField key={module.loginRole}>
                    <FormFieldLabel>
                      {remoteModules.find(
                        ({ loginRole }) => loginRole === module.loginRole,
                      )?.title ??
                        remoteModules.find(
                          ({ loginRole }) => loginRole === module.loginRole,
                        )?.name ??
                        module.loginRole}{" "}
                      group
                    </FormFieldLabel>
                    <ListBox
                      aria-label={`${module.loginRole} group`}
                      selected={assignment ? [assignment.groupId] : []}
                      onSelectionChange={(_, selected) =>
                        changeGroup(module.loginRole, selected)
                      }
                    >
                      {module.groups.map((group) => (
                        <Option key={group.groupId} value={group.groupId}>
                          {groupLabel(group)}
                        </Option>
                      ))}
                    </ListBox>
                  </FormField>
                );
              })}
            </>
          ) : null}
          {selectionError ? <p role="alert">{selectionError}</p> : null}
          <FormFieldHelperText>
            Add a module to use its least-privileged group, or choose an
            eligible group for elevated access. Changes are saved with the user.
          </FormFieldHelperText>
        </>
      ) : (
        <FormFieldHelperText>
          Save this user, then reopen it to edit portal module access.
        </FormFieldHelperText>
      )}
    </FormField>
  );
};
