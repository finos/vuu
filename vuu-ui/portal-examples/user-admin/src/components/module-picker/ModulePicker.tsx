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
export interface ModulePickerModuleDescriptor extends ItemDescriptor {
  permissions: string[];
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
    throw Error(`[useModuleDescriptor] no ModuleDescriptor found for '${name}'`);
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
  const { onPermissionsChange } = useModuleDescriptorContext();
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
      )}
      data-name={item.name}
    >
      {item.icon ? <Icon name={item.icon} /> : null}
      <span className="vuuItemPicker-text vuuModulePicker-moduleName">
        {valueWithHighlighting}
      </span>
      <PermissionGroupPicker
        item={moduleDescriptor}
        onSelectedPermissionsChange={handleSelectedPermissionsChange}
      />
      <IconButton
        className="vuuItemPickerListItem-action"
        data-embedded
        appearance="transparent"
        icon="cross"
        onClick={handleRemoveButtonClick}
        size={16}
      />
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
      )}
      data-name={item.name}
      disabled={disabled}
    >
      <span className="vuuItemPicker-text vuuModulePicker-moduleName">
        {valueWithHighlighting}
      </span>
      <Button
        appearance="solid"
        className="vuuItemPickerListItem-action vuuModulePicker-addButton"
        onClick={onAdd}
        disabled={disabled}
      >
        Add
        <Icon name="plus" />
      </Button>
    </Option>
  );
};

export interface ModulePickerProps
  extends Omit<
    ItemPickerProps,
    "allItems" | "selectedItems" | "onSelectedItemsChange"
  > {
  allModules: ModulePickerModuleDescriptor[];
  selectedModules: ModulePickerModuleDescriptor[];
  onSelectedModulesChange: (
    selectedModules: ModulePickerModuleDescriptor[],
  ) => void;
}

export const ModulePicker = ({
  allModules,
  selectedModules,
  onSelectedModulesChange,
  ...itemPickerProps
}: ModulePickerProps) => {
  const moduleDescriptors = useMemo(
    () => new Map(allModules.map((item) => [item.name, item])),
    [allModules],
  );
  const allItems = useMemo(
    () => allModules.map(toItemDescriptor),
    [allModules],
  );
  const selectedItems = useMemo(
    () => selectedModules.map(toItemDescriptor),
    [selectedModules],
  );

  const handleSelectedItemsChange = useCallback(
    (items: readonly ItemDescriptor[]) => {
      const newSelectedModules = items.map(({ name }) => {
        const moduleDescriptor = moduleDescriptors.get(name);
        if (!moduleDescriptor) {
          throw Error(
            `[ModulePicker] no ModuleDescriptor found for '${name}'`,
          );
        }
        return moduleDescriptor;
      });
      onSelectedModulesChange(newSelectedModules);
    },
    [moduleDescriptors, onSelectedModulesChange],
  );

  const handlePermissionsChange = useCallback(
    (name: string, selectedPermissions: string[]) => {
      const newSelectedModules = selectedModules.map((module) =>
        module.name === name ? { ...module, selectedPermissions } : module,
      );
      onSelectedModulesChange(newSelectedModules);
    },
    [selectedModules, onSelectedModulesChange],
  );

  const moduleDescriptorContextValue = useMemo(
    () => ({ moduleDescriptors, onPermissionsChange: handlePermissionsChange }),
    [moduleDescriptors, handlePermissionsChange],
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
