import { usePortalModuleRegistry } from "@vuu-ui/core/portal";
import {
  type ComponentProps,
  type MouseEventHandler,
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
import { Option } from "@salt-ds/core";
import cx from "clsx";

type SelectedListItemProps = ComponentProps<
  NonNullable<ItemPickerProps["SelectedListItem"]>
>;

type AvailableListItemProps = ComponentProps<
  NonNullable<ItemPickerProps["AvailableListItem"]>
>;

const getItemLabel = (item: ItemDescriptor) => item.label ?? item.name;

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
      className={cx(classNameProp, "vuuItemPickerListItem")}
      data-name={item.name}
    >
      {item.icon ? <Icon name={item.icon} /> : null}
      <span className="vuuItemPicker-text">{valueWithHighlighting}</span>
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
      className={cx(classNameProp, "vuuItemPickerListItem")}
      data-name={item.name}
      disabled={disabled}
    >
      <span className="vuuItemPicker-text">{valueWithHighlighting}</span>
      <IconButton
        className="vuuItemPickerListItem-action"
        data-embedded
        appearance="transparent"
        icon="plus"
        onClick={onAdd}
        size={16}
        disabled={disabled}
      />
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
      itemTypeName="module"
      layout="v-available-selected"
      onSelectedItemsChange={handleSelectedItemsChange}
      SelectedListItem={ModulePickerSelectedListItem}
      selectedItems={selectedItems}
    />
  );
};
