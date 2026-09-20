import { Button, Option } from "@salt-ds/core";
import { applyHighlighting } from "@vuu-ui/vuu-table";
import {
  Icon,
  IconButton,
  type ItemDescriptor,
  ItemPicker,
  type ItemPickerProps,
} from "@vuu-ui/vuu-ui-controls";
import cx from "clsx";
import {
  type ComponentProps,
  type MouseEventHandler,
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import type { ModulePermissions } from "../user-edit-form/ModulePermissions";
import { PermissionGroupPicker } from "./PermissionGroupPicker";

import "./ModulePicker.css";

type SelectedListItemProps = ComponentProps<
  NonNullable<ItemPickerProps["SelectedListItem"]>
>;

type AvailableListItemProps = ComponentProps<
  NonNullable<ItemPickerProps["AvailableListItem"]>
>;

const getItemLabel = (item: ItemDescriptor) => item.label ?? item.name;

/** Extends ItemDescriptor with the permission options and current selection used to populate
 * the ComboBox embedded within the custom SelectedItem. */
export interface ModulePickerPermissionDescriptor {
  label?: string;
  name: string;
}

export type ModulePickerPermission = string | ModulePickerPermissionDescriptor;

export interface ModulePickerModuleDescriptor extends ItemDescriptor {
  clientIdentifier?: string;
  defaultPermission?: string;
  permissions: ModulePickerPermission[];
  selectedPermissions: string[];
}
const toItemDescriptor = ({
  name,
  label,
  icon,
  group,
}: ModulePickerModuleDescriptor): ItemDescriptor => ({
  name,
  label,
  icon,
  group,
});
/** Looks up ModuleDescriptors by item name, keeping ItemPicker's allItems untouched as plain ItemDescriptors. */
interface ModuleDescriptorContextValue {
  moduleDescriptors: Map<string, ModulePickerModuleDescriptor>;
  onPermissionsChange: (name: string, selectedPermissions: string[]) => void;
  permissionMultiselect: boolean;
  readOnly: boolean;
}

const ModuleDescriptorContext =
  createContext<ModuleDescriptorContextValue | null>(null);

const ModuleDescriptorProvider = ({
  children,
  value,
}: {
  children: ReactNode;
  value: ModuleDescriptorContextValue;
}) => (
  <ModuleDescriptorContext.Provider value={value}>
    {children}
  </ModuleDescriptorContext.Provider>
);

const useModuleDescriptorContext = (): ModuleDescriptorContextValue => {
  const context = useContext(ModuleDescriptorContext);
  if (!context) {
    throw Error(
      "[useModuleDescriptorContext] must be used within a ModuleDescriptorProvider",
    );
  }
  return context;
};

const useModuleDescriptor = (name: string): ModulePickerModuleDescriptor => {
  const { moduleDescriptors } = useModuleDescriptorContext();
  const moduleDescriptor = moduleDescriptors.get(name);
  if (!moduleDescriptor) {
    throw Error(
      `[useModuleDescriptor] no ModuleDescriptor found for '${name}'`,
    );
  }
  return moduleDescriptor;
};

const ModulePickerSelectedListItem = ({
  className: classNameProp,
  index,
  item,
  onRemove,
  searchPattern = "",
  ...optionProps
}: SelectedListItemProps) => {
  const moduleDescriptor = useModuleDescriptor(item.name);
  const { onPermissionsChange, permissionMultiselect, readOnly } =
    useModuleDescriptorContext();
  const handleSelectedPermissionsChange = useCallback(
    (selectedPermissions: string[]) => {
      onPermissionsChange(item.name, selectedPermissions);
    },
    [item.name, onPermissionsChange],
  );
  const valueWithHighlighting = applyHighlighting(
    getItemLabel(item),
    searchPattern,
  );
  const handleRemoveButtonClick = useCallback<
    MouseEventHandler<HTMLButtonElement>
  >(
    (event) => {
      event.stopPropagation();
      onRemove(event);
    },
    [onRemove],
  );

  return (
    <Option
      {...optionProps}
      className={cx(
        classNameProp,
        "vuuItemPickerListItem",
        "vuuModulePickerListItem",
        "vuuModulePickerListItem-selected",
        { "vuuModulePickerListItem-readOnly": readOnly },
      )}
      data-name={item.name}
    >
      {item.icon ? <Icon name={item.icon} /> : null}
      <span className="vuuItemPicker-text vuuModulePicker-moduleName">
        {valueWithHighlighting}
      </span>
      <PermissionGroupPicker
        item={moduleDescriptor}
        multiselect={permissionMultiselect}
        onSelectedPermissionsChange={handleSelectedPermissionsChange}
        readOnly={readOnly}
      />
      {!readOnly ? (
        <IconButton
          className="vuuItemPickerListItem-action"
          data-embedded
          appearance="transparent"
          icon="cross"
          onClick={handleRemoveButtonClick}
          size={16}
        />
      ) : null}
    </Option>
  );
};

const ModulePickerAvailableListItem = ({
  className: classNameProp,
  item,
  onAdd,
  searchPattern = "",
  disabled,
  ...optionProps
}: AvailableListItemProps) => {
  const { readOnly } = useModuleDescriptorContext();
  const valueWithHighlighting = applyHighlighting(
    getItemLabel(item),
    searchPattern,
  );

  return (
    <Option
      {...optionProps}
      className={cx(
        classNameProp,
        "vuuItemPickerListItem",
        "vuuModulePickerListItem",
        "vuuModulePickerListItem-available",
        { "vuuModulePickerListItem-readOnly": readOnly },
      )}
      data-name={item.name}
      disabled={disabled}
    >
      <span className="vuuItemPicker-text vuuModulePicker-moduleName">
        {valueWithHighlighting}
      </span>
      {!readOnly ? (
        <Button
          appearance="solid"
          className="vuuItemPickerListItem-action vuuModulePicker-addButton"
          onClick={onAdd}
          disabled={disabled}
        >
          Add
          <Icon name="plus" />
        </Button>
      ) : null}
    </Option>
  );
};

export type SelectedModulesChangeHandler = (
  selectedModules: ModulePickerModuleDescriptor[],
) => void;
export interface ModulePickerProps
  extends Omit<
    ItemPickerProps,
    "allItems" | "selectedItems" | "onSelectedItemsChange"
  > {
  allModules: ModulePickerModuleDescriptor[];
  modulePermissions?: ModulePermissions;
  onSelectedModulesChange: SelectedModulesChangeHandler;
  permissionMultiselect?: boolean;
  readOnly?: boolean;
  selectedModules?: ModulePickerModuleDescriptor[];
}

export const ModulePicker = ({
  allModules,
  modulePermissions,
  onSelectedModulesChange,
  permissionMultiselect = true,
  readOnly = false,
  selectedModules: selectedModulesProp,
  ...itemPickerProps
}: ModulePickerProps) => {
  const allItems = useMemo(
    () => allModules.map(toItemDescriptor),
    [allModules],
  );
  const selectedModules = useMemo(() => {
    if (!modulePermissions) return selectedModulesProp ?? [];
    return allModules
      .filter(({ name }) => modulePermissions.hasApplication(name))
      .map((module) => ({
        ...module,
        selectedPermissions: [...modulePermissions.groupIdsFor(module.name)],
      }));
  }, [allModules, modulePermissions, selectedModulesProp]);
  const moduleDescriptors = useMemo(
    () =>
      new Map(
        [...allModules, ...selectedModules].map((item) => [item.name, item]),
      ),
    [allModules, selectedModules],
  );
  const selectedItems = useMemo(
    () => selectedModules.map(toItemDescriptor),
    [selectedModules],
  );

  const handleSelectedItemsChange = useCallback(
    (items: readonly ItemDescriptor[]) => {
      if (readOnly) return;
      const newSelectedModules = items.map(({ name }) => {
        const moduleDescriptor =
          selectedModules.find((module) => module.name === name) ??
          moduleDescriptors.get(name);
        if (!moduleDescriptor) {
          throw Error(`[ModulePicker] no ModuleDescriptor found for '${name}'`);
        }
        return moduleDescriptor;
      });
      onSelectedModulesChange(newSelectedModules);
    },
    [moduleDescriptors, onSelectedModulesChange, readOnly, selectedModules],
  );

  const handlePermissionsChange = useCallback(
    (name: string, selectedPermissions: string[]) => {
      if (readOnly) return;
      const newSelectedModules = selectedModules.map((module) =>
        module.name === name ? { ...module, selectedPermissions } : module,
      );
      onSelectedModulesChange(newSelectedModules);
    },
    [readOnly, selectedModules, onSelectedModulesChange],
  );

  const moduleDescriptorContextValue = useMemo(
    () => ({
      moduleDescriptors,
      onPermissionsChange: handlePermissionsChange,
      permissionMultiselect,
      readOnly,
    }),
    [
      moduleDescriptors,
      handlePermissionsChange,
      permissionMultiselect,
      readOnly,
    ],
  );

  return (
    <ModuleDescriptorProvider value={moduleDescriptorContextValue}>
      <ItemPicker
        {...itemPickerProps}
        allItems={allItems}
        AvailableListItem={ModulePickerAvailableListItem}
        className="vuuModulePicker"
        itemTypeName="module"
        onSelectedItemsChange={handleSelectedItemsChange}
        SelectedListItem={ModulePickerSelectedListItem}
        selectedItems={selectedItems}
      />
    </ModuleDescriptorProvider>
  );
};
