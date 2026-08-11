import {
  ForwardedRef,
  forwardRef,
  RefCallback,
  HTMLAttributes,
  MouseEventHandler,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Button,
  Input,
  ListBox,
  ListBoxProps,
  Option,
  OptionProps,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { applyHighlighting } from "@vuu-ui/vuu-table";
import { Icon, IconButton } from "@vuu-ui/vuu-ui-controls";
import { DragDropProvider, useSortable } from "@vuu-ui/vuu-utils";
import {
  ItemDescriptor,
  CreateCustomItemProps,
  ItemPickerHookProps,
  useItemPicker,
} from "./useItemPicker";
import cx from "clsx";

import itemPickerCss from "./ItemPicker.css";

const classBase = "vuuItemPicker";

export const classBaseListItem = "vuuItemPickerListItem";

export interface ItemPickerProps
  extends ItemPickerHookProps,
    HTMLAttributes<HTMLDivElement>,
    Pick<ListBoxProps<ItemDescriptor>, "selected" | "onSelectionChange"> {
  itemTypeSingular: string;
  createCustomItemProps?: CreateCustomItemProps;
}

const getItemLabel = (item: ItemDescriptor) => {
  if (item.label) return item.label;
  else return item.name;
};

const searchIcon = <span data-icon="search" />;
const NO_SELECTION: ItemDescriptor[] = [] as const;

const useSorting = (id: string, index: number) => {
  const { handleRef: sortableHandleRef, ref: sortableRef } = useSortable({
    id,
    index,
  });

  const [handleRef, ref] = useMemo(() => {
    return [sortableHandleRef, sortableRef];
  }, [sortableHandleRef, sortableRef]);

  return {
    handleRef,
    ref,
  };
};

const SelectedListItem = ({
  className: classNameProp,
  index,
  item,
  onRemove,
  searchPattern = "",
  ...optionProps
}: OptionProps & {
  index: number;
  item: ItemDescriptor;
  onRemove: MouseEventHandler<HTMLButtonElement>;
  searchPattern?: Lowercase<string>;
}) => {
  const { handleRef, ref } = useSorting(item.name, index);
  const value = getItemLabel(item as ItemDescriptor);
  const valueWithHighlighting = applyHighlighting(value, searchPattern);

  const handleRemoveButtonClick = useCallback<
    MouseEventHandler<HTMLButtonElement>
  >(
    (e) => {
      e.stopPropagation();
      onRemove?.(e);
    },
    [onRemove],
  );

  return (
    <Option
      {...optionProps}
      className={cx(classNameProp, classBaseListItem)}
      data-name={item.name}
      ref={ref}
    >
      <IconButton
        data-embedded
        appearance="transparent"
        icon="draggable"
        ref={handleRef}
        size={16}
      />
      {item.icon ? <Icon name={item.icon} key="icon" /> : null}
      <span className={`${classBase}-text`}>{valueWithHighlighting}</span>
      <IconButton
        className={`${classBaseListItem}-action`}
        data-embedded
        appearance="transparent"
        icon="cross"
        onClick={handleRemoveButtonClick}
        size={16}
      />
    </Option>
  );
};

const AvailableListItem = ({
  className: classNameProp,
  index,
  item,
  onAdd,
  searchPattern = "",
  ...optionProps
}: OptionProps & {
  index: number;
  item: ItemDescriptor;
  onAdd: MouseEventHandler<HTMLButtonElement>;
  searchPattern?: Lowercase<string>;
}) => {
  const value = getItemLabel(item as ItemDescriptor);
  const valueWithHighlighting = applyHighlighting(value, searchPattern);

  return (
    <Option
      {...optionProps}
      className={cx(classNameProp, classBaseListItem)}
      data-name={item.name}
    >
      <span className={`${classBase}-text`}>{valueWithHighlighting}</span>
      <IconButton
        className={`${classBaseListItem}-action`}
        data-embedded
        appearance="transparent"
        icon="plus"
        onClick={onAdd}
        size={16}
      />
    </Option>
  );
};

/** Generic controlled component that displays items in a 'picker' that are available to search, select, reorder or deselect.
 * As input props, all available items, currently selected items, search text and callback functions for changes in selected items and search text
 * must be supplied by the client.
 */
export const ItemPicker = forwardRef(function ItemPicker(
  {
    className,
    itemTypeSingular,
    allItems,
    selectedItems,
    searchPattern,
    onSelectedItemsChange,
    onSearchPatternChange,
    onSelectionChange,
    selected = NO_SELECTION,
    createCustomItemProps,
    ...htmlAttributes
  }: ItemPickerProps,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-item-picker",
    css: itemPickerCss,
    window: targetWindow,
  });

  const searchCallbackRef = useCallback<RefCallback<HTMLElement>>((el) => {
    setTimeout(() => {
      el?.querySelector("input")?.focus();
    }, 100);
  }, []);

  const {
    selectedItemsFiltered,
    availableItemsFiltered,
    searchText,
    onChangeSearchInput,
    onAddItemToSelectedList,
    onRemoveItemFromSelectedList,
    onReorderSelectedItems,
  } = useItemPicker({
    allItems,
    selectedItems,
    searchPattern,
    onSelectedItemsChange,
    onSearchPatternChange,
  });

  const listRef = useRef<HTMLDivElement>(null);

  const getOptionName = (option?: HTMLElement) => {
    if (option) {
      const { name } = option.dataset;
      if (name) {
        return name;
      }
    }
    throw Error("[ItemPicker] list option has no data-name");
  };

  const handleDragEnd = useCallback(() => {
    setTimeout(() => {
      const listItems =
        listRef.current?.querySelectorAll<HTMLDivElement>(".saltOption");
      if (listItems) {
        const orderedItemNames = Array.from(listItems).map(getOptionName);
        onReorderSelectedItems(orderedItemNames);
      }
    }, 300);
  }, [availableItemsFiltered, selectedItemsFiltered]);

  const searchPlaceholderText = `Find ${itemTypeSingular.toLowerCase()}`;
  const selectedItemsHeading = `${itemTypeSingular.charAt(0).toUpperCase()}${itemTypeSingular.toLowerCase().slice(1)}s in view`;
  const availableItemsHeading = `Available ${itemTypeSingular.toLowerCase()}s`;

  return (
    <div
      {...htmlAttributes}
      className={cx(classBase, className)}
      ref={forwardedRef}
    >
      <form className={`${classBase}-search`} role="search">
        <Input
          startAdornment={searchIcon}
          placeholder={searchPlaceholderText}
          ref={searchCallbackRef}
          value={searchText}
          onChange={onChangeSearchInput}
        />
      </form>

      <div className={`${classBase}-scrollContainer vuuScrollable`}>
        <div className={`${classBase}-sectionHeader`}>
          {selectedItemsHeading}
        </div>
        <DragDropProvider onDragEnd={handleDragEnd}>
          <ListBox
            className={`${classBase}-selectedList`}
            onSelectionChange={onSelectionChange}
            ref={listRef}
            selected={selected}
          >
            {selectedItemsFiltered.map((item, index) => (
              <SelectedListItem
                item={item}
                index={index}
                key={item.name}
                onRemove={onRemoveItemFromSelectedList}
                searchPattern={searchText.toLowerCase() as Lowercase<string>}
                value={item}
              />
            ))}
          </ListBox>
        </DragDropProvider>

        <div
          className={cx(
            `${classBase}-sectionHeader`,
            `${classBase}-availableHeader`,
          )}
        >
          {availableItemsHeading}
        </div>
        <ListBox
          className={`${classBase}-availableList`}
          selected={NO_SELECTION}
        >
          {availableItemsFiltered.map((item, index) => (
            <AvailableListItem
              item={item}
              index={index}
              key={item.name}
              onAdd={onAddItemToSelectedList}
              searchPattern={searchText.toLowerCase() as Lowercase<string>}
              value={item}
            />
          ))}
        </ListBox>
      </div>
      {createCustomItemProps ? (
        <div className={`${classBase}-item-buttons`}>
          <Button onClick={createCustomItemProps.onClickCreateCustomItem}>
            {createCustomItemProps.buttonLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
});
