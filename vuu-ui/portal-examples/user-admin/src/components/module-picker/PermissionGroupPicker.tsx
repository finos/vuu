import { ComboBox, Option } from "@salt-ds/core";
import {
    type ChangeEvent,
    type SyntheticEvent,
    useCallback,
    useState,
} from "react";
import type { ModulePickerModuleDescriptor } from "./ModulePicker";

const getItemLabel = (item: ModulePickerModuleDescriptor) => item.label ?? item.name;

const stopOptionEvent = (event: SyntheticEvent) => {
    event.stopPropagation();
};

export const PermissionGroupPicker = ({
    item,
    onSelectedPermissionsChange,
}: {
    item: ModulePickerModuleDescriptor;
    onSelectedPermissionsChange: (selectedPermissions: string[]) => void;
}) => {
    const [value, setValue] = useState("");
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
                className="vuuModulePicker-permission"
                defaultSelected={item.selectedPermissions ?? [item.permissions[0]]}
                multiselect={true}
                onChange={handleChange}
                onSelectionChange={handleSelectionChange}
                selectOnTab
                value={value}
            >
                {item.permissions.map((permission) => (
                    <Option key={permission} value={permission}>
                        {permission}
                    </Option>
                ))}
            </ComboBox>
        </span>
    );
};
