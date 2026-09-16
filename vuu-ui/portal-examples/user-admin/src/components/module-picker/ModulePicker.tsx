import { usePortalModuleRegistry } from "@vuu-ui/core/portal";
import {
  type ComponentProps,
  type ChangeEvent,
  type MouseEventHandler,
  type SyntheticEvent,
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  type ItemDescriptor,
  Icon,
  IconButton,
  ItemPicker,
  type ItemPickerProps,
} from "@vuu-ui/vuu-ui-controls";
import { applyHighlighting } from "@vuu-ui/vuu-table";
import { Button, ComboBox, Option } from "@salt-ds/core";
import cx from "clsx";

import "./ModulePicker.css";

type SelectedListItemProps = ComponentProps<
  NonNullable<ItemPickerProps["SelectedListItem"]>
>;

type AvailableListItemProps = ComponentProps<
  NonNullable<ItemPickerProps["AvailableListItem"]>
>;

const getItemLabel = (item: ItemDescriptor) => item.label ?? item.name;
const permissionGroups = ["read", "edit"] as const;

const stopOptionEvent = (event: SyntheticEvent) => {
  event.stopPropagation();
};

const PermissionGroupPicker = ({ item }: { item: ItemDescriptor }) => {
  const [value, setValue] = useState("");
  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  }, []);
  const handleSelectionChange = useCallback(() => {
    setValue("");
  }, []);

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
        defaultSelected={[item.group ?? permissionGroups[0]]}
        multiselect={true}
        onChange={handleChange}
        onSelectionChange={handleSelectionChange}
        selectOnTab
        value={value}
      >
        {permissionGroups.map((group) => (
          <Option key={group} value={group}>
            {group}
          </Option>
        ))}
      </ComboBox>
    </span>
  );
};

const ModulePickerSelectedListItem = ({
  className: classNameProp,
  index,
  item,
  onRemove,
  searchPattern = "",
  ...optionProps
}: SelectedListItemProps) => {
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
        "vuuModulePicker-listItem",
      )}
      data-name={item.name}
    >
      {item.icon ? <Icon name={item.icon} /> : null}
      <span className="vuuItemPicker-text vuuModulePicker-moduleName">
        {valueWithHighlighting}
      </span>
      <PermissionGroupPicker item={item} />
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
        "vuuModulePicker-listItem",
        "vuuModulePicker-availableListItem",
      )}
      data-name={item.name}
      disabled={disabled}
    >
      <span className="vuuItemPicker-text vuuModulePicker-moduleName">
        {valueWithHighlighting}
      </span>
      <Button
        className="vuuItemPickerListItem-action vuuModulePicker-addButton"
        onClick={onAdd}
        disabled={disabled}
        variant="secondary"
      >
        Add
        <Icon name="plus" />
      </Button>
    </Option>
  );
};

export interface ModulePickerProps {
  allItems?: ItemDescriptor[];
}

export const ModulePicker = ({ allItems: allItemsProp }: ModulePickerProps) => {
  const { remoteModules } = usePortalModuleRegistry();
  const [selectedItems, setSelectedItems] = useState<ItemDescriptor[]>([]);
  const moduleItems = useMemo(
    () =>
      remoteModules.map(({ loginRole, name, title }) => ({
        label: title ?? name,
        name: loginRole,
      })),
    [remoteModules],
  );
  const allItems = allItemsProp ?? moduleItems;

  const handleSelectedItemsChange = useCallback(
    (items: readonly ItemDescriptor[]) => {
      setSelectedItems([...items]);
    },
    [],
  );

  return (
    <ItemPicker
      allItems={allItems}
      AvailableListItem={ModulePickerAvailableListItem}
      className="vuuModulePicker"
      itemTypeName="module"
      layout="v-available-selected"
      onSelectedItemsChange={handleSelectedItemsChange}
      SelectedListItem={ModulePickerSelectedListItem}
      selectedItems={selectedItems}
    />
  );
};
