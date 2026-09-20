import { ComboBox, Option } from "@salt-ds/core";
import {
    type ChangeEvent,
    type SyntheticEvent,
    useCallback,
    useState,
} from "react";
import type { ModulePickerModuleDescriptor } from "./ModulePicker";

const getItemLabel = (item: ModulePickerModuleDescriptor) =>
  item.label ?? item.name;

const permissionDescriptor = (
  permission: ModulePickerModuleDescriptor["permissions"][number],
) =>
  typeof permission === "string"
    ? { label: permission, name: permission }
    : { label: permission.label ?? permission.name, name: permission.name };

const stopOptionEvent = (event: SyntheticEvent) => {
    event.stopPropagation();
};

export const PermissionGroupPicker = ({
    item,
    multiselect = true,
    onSelectedPermissionsChange,
}: {
    item: ModulePickerModuleDescriptor;
    multiselect?: boolean;
    onSelectedPermissionsChange: (selectedPermissions: string[]) => void;
}) => {
    const [value, setValue] = useState("");
    const selectedPermissions =
        item.selectedPermissions.length > 0
            ? item.selectedPermissions
            : item.permissions.length > 0
                ? [permissionDescriptor(item.permissions[0]).name]
                : [];
    const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.value);
    }, []);
    const handleSelectionChange = useCallback(
        (_event: SyntheticEvent, newSelected: string[]) => {
            setValue("");
            onSelectedPermissionsChange(newSelected);
        },
        [onSelectedPermissionsChange],
    );

    return (
        <span
            className="vuuModulePicker-permissionControl"
            onClick={stopOptionEvent}
            onKeyDown={stopOptionEvent}
            onMouseDown={stopOptionEvent}
            onPointerDown={stopOptionEvent}
        >
            <ComboBox
                aria-label={`${getItemLabel(item)} permission group`}
                bordered
                className="vuuModulePicker-permission"
                multiselect={multiselect}
                onChange={handleChange}
                onSelectionChange={handleSelectionChange}
                selected={selectedPermissions}
                selectOnTab
                value={value}
            >
                {item.permissions.map((permission) => {
                    const { label, name } = permissionDescriptor(permission);
                    return (
                        <Option key={name} value={name}>
                            {label}
                        </Option>
                    );
                })}
            </ComboBox>
        </span>
    );
};
