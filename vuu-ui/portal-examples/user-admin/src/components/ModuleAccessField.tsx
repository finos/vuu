import {
  FormField,
  FormFieldHelperText,
  FormFieldLabel,
  ListBox,
  Option,
} from "@salt-ds/core";
import { usePortalModuleRegistry } from "@vuu-ui/core/portal";
import { useCallback, useMemo, useState } from "react";
import { columnFor, type AdminRecord } from "../data/admin-contract";
import { useAdminConfig } from "../data/AdminDataContext";
import type {
  ModuleAccessAssignment,
  ModuleAccessModule,
  UserModuleAccess,
} from "../data/module-access";
import { resolveModuleAccessValues } from "./ModuleAccessCell";
import {
  ModulePicker,
  type ModulePickerModuleDescriptor,
} from "./module-picker/ModulePicker";

export interface ModuleAccessFieldProps {
  access?: UserModuleAccess;
  allModules?: ModulePickerModuleDescriptor[];
  assignments?: readonly ModuleAccessAssignment[];
  disabled?: boolean;
  error?: string;
  loading?: boolean;
  onChange?: (assignments: ModuleAccessAssignment[]) => void;
  record?: AdminRecord;
}

const assignmentFor = (
  assignments: readonly ModuleAccessAssignment[],
  accessRole: string,
) => assignments.find((assignment) => assignment.accessRole === accessRole);

const groupLabel = (group: ModuleAccessModule["groups"][number]) =>
  group.groupDisplayName;

export const ModuleAccessField = ({
  access,
  allModules,
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
  const currentAssignments = assignments ?? [];
  const pickerModules = useMemo<ModulePickerModuleDescriptor[]>(() => {
    const sourceModules: ModulePickerModuleDescriptor[] =
      allModules ??
      (access?.modules ?? []).map(({ accessRole }) => ({
        name: accessRole,
        permissions: [],
        selectedPermissions: [],
      }));
    return sourceModules.map((moduleDescriptor) => {
      const module = access?.modules.find(
        ({ accessRole }) => accessRole === moduleDescriptor.name,
      );
      if (!module) return moduleDescriptor;
      const assignment = assignmentFor(currentAssignments, module.accessRole);
      const remoteModule = remoteModules.find(
        ({ accessRole }) => accessRole === module.accessRole,
      );
      return {
        ...moduleDescriptor,
        label:
          moduleDescriptor.label ??
          remoteModule?.title ??
          remoteModule?.name ??
          module.accessRole,
        permissions: module.groups.map((group) => ({
          label: groupLabel(group),
          name: group.groupId,
        })),
        selectedPermissions: assignment ? [assignment.groupId] : [],
      };
    });
  }, [access?.modules, allModules, currentAssignments, remoteModules]);
  const selectedModules = useMemo(
    () =>
      pickerModules.filter(({ name }) =>
        currentAssignments.some(({ accessRole }) => accessRole === name),
      ),
    [pickerModules, currentAssignments],
  );

  const changeSelection = useCallback(
    (modules: ModulePickerModuleDescriptor[]) => {
      setSelectionError(undefined);
      const next: ModuleAccessAssignment[] = [];
      for (const selectedModule of modules) {
        const module = access?.modules.find(
          ({ accessRole }) => accessRole === selectedModule.name,
        );
        const groupId = selectedModule.selectedPermissions[0];
        const defaultGroup =
          module?.groups.find(({ isDefault }) => isDefault) ??
          (module?.groups.length === 1 ? module.groups[0] : undefined);
        const selectedGroupId = groupId ?? defaultGroup?.groupId;
        if (!selectedGroupId) {
          setSelectionError(
            `No least-privileged group is available for ${selectedModule.label ?? selectedModule.name}.`,
          );
          return;
        }
        next.push({
          accessRole: selectedModule.name,
          groupId: selectedGroupId,
        });
      }
      onChange?.(next);
    },
    [access?.modules, onChange],
  );

  if (!access || !onChange) {
    const value = record?.[columnFor(config, "users", "module_access")];
    const values = resolveModuleAccessValues(value, remoteModules);
    return (
      <FormField disabled>
        <FormFieldLabel>Portal module access</FormFieldLabel>
        <ListBox
          aria-label="Remote module access"
          bordered
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
            <ModulePicker
              allModules={pickerModules}
              aria-label="Portal modules"
              itemTypeName="remote module"
              onSelectedModulesChange={changeSelection}
              permissionMultiselect={false}
              searchForm={false}
              selectedModules={selectedModules}
            />
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
