import {
  Input,
  ListBox,
  type ListBoxProps,
  Option,
  type OptionProps,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { applyHighlighting } from "@vuu-ui/vuu-table";
import {
  DragDropProvider,
  type ItemTypeName,
  pluralForm,
  singularForm,
  useSortable,
} from "@vuu-ui/vuu-utils";
import cx from "clsx";
import {
  type ComponentType,
  type ForwardedRef,
  forwardRef,
  type HTMLAttributes,
  type MouseEventHandler,
  type RefCallback,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Icon, IconButton } from "../icon-button";
import {
  getItemLabel,
  type ItemDescriptor,
  type ItemPickerHookProps,
  useItemPicker,
} from "./useItemPicker";

import itemPickerCss from "./ItemPicker.css";

const classBase = "vuuItemPicker";

export const classBaseListItem = "vuuItemPickerListItem";

export type ItemPickerLayout = 'v-available-selected' | 'v-selected-available';

export interface ItemPickerProps
  extends
  ItemPickerHookProps,
  HTMLAttributes<HTMLDivElement>,
  Pick<ListBoxProps<ItemDescriptor>, "selected" | "onSelectionChange"> {
  AvailableListItem?: ComponentType<AvailableListItemProps>;
  SelectedListItem?: ComponentType<SelectedListItemProps>;
  itemTypeName?: ItemTypeName;
  /**
   * Display order of SelectedItems List / AvailableItems List
   */
  layout?: ItemPickerLayout;
  searchForm?: boolean;
}

const searchIcon = <Icon name="search" />;
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

interface SelectedListItemProps extends OptionProps {
  index: number;
  item: ItemDescriptor;
  onRemove: MouseEventHandler<HTMLButtonElement>;
  searchPattern?: Lowercase<string>;
}

const DefaultSelectedListItem = ({
  className: classNameProp,
  index,
  item,
  onRemove,
  searchPattern = "",
  ...optionProps
}: SelectedListItemProps) => {
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

interface AvailableListItemProps extends OptionProps {
  index: number;
  item: ItemDescriptor;
  onAdd: MouseEventHandler<HTMLButtonElement>;
  searchPattern?: Lowercase<string>;
}

const DefaultAvailableListItem = ({
  className: classNameProp,
  index,
  item,
  onAdd,
  searchPattern = "",
  disabled,
  ...optionProps
}: AvailableListItemProps) => {
  const value = getItemLabel(item as ItemDescriptor);
  const valueWithHighlighting = applyHighlighting(value, searchPattern);

  return (
    <Option
      {...optionProps}
      className={cx(classNameProp, classBaseListItem)}
      data-name={item.name}
      disabled={disabled}
    >
      <span className={`${classBase}-text`}>{valueWithHighlighting}</span>
      <IconButton
        className={`${classBaseListItem}-action`}
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

const getOptionName = (option?: HTMLElement) => {
  if (option) {
    const { name } = option.dataset;
    if (name) {
      return name;
    }
  }
  throw Error("[ItemPicker] list option has no data-name");
};

/** Generic controlled component that displays items in a 'picker' that are available to search, select, reorder or deselect.
 * As input props, all available items, currently selected items, search text and callback functions for changes in selected items and search text
 * must be supplied by the client.
 */
export const ItemPicker = forwardRef(function ItemPicker(
  {
    AvailableListItem = DefaultAvailableListItem,
    SelectedListItem = DefaultSelectedListItem,
    className,
    itemTypeName = 'Item',
    searchForm = true,
    allItems,
    layout = 'v-selected-available',
    selectedItems,
    maxSelections,
    onSelectedItemsChange,
    onSelectionChange,
    selected = NO_SELECTION,
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
    selectedItemsCount,
    availableItemsCount,
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
    onSelectedItemsChange,
    maxSelections,
  });

  const listRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = useCallback(() => {
    setTimeout(() => {
      const listItems =
        listRef.current?.querySelectorAll<HTMLDivElement>(".saltOption");
      if (listItems) {
        const orderedItemNames = Array.from(listItems).map(getOptionName);
        onReorderSelectedItems(orderedItemNames);
      }
    }, 300);
  }, [onReorderSelectedItems]);

  const searchPlaceholderText = `Find ${singularForm(itemTypeName)}`;
  const maxSelectionsSubHeading = maxSelections ? `(${maxSelections} max)` : "";
  const selectedItemsHeading = `${selectedItemsCount} ${selectedItemsCount === 1 ? singularForm(itemTypeName) : pluralForm(itemTypeName)} in view ${maxSelectionsSubHeading}`;
  const availableItemsHeading = `${availableItemsCount} available ${availableItemsCount === 1 ? singularForm(itemTypeName) : pluralForm(itemTypeName)}`;


  const selectedList = (
    <>
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
    </>
  )

  const availableList = (
    <>
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
            disabled={selectedItemsCount === maxSelections}
          />
        ))}
      </ListBox>
    </>
  )

  return (
    <div
      {...htmlAttributes}
      className={cx(classBase, className)}
      ref={forwardedRef}
    >
      {searchForm ? (
        <form className={`${classBase}-search`} role="search">
          <Input
            startAdornment={searchIcon}
            placeholder={searchPlaceholderText}
            ref={searchCallbackRef}
            value={searchText}
            onChange={onChangeSearchInput}
          />
        </form>
      ) : (
        <div className={`${classBase}-search`} role="search">
          <Input
            startAdornment={searchIcon}
            placeholder={searchPlaceholderText}
            ref={searchCallbackRef}
            value={searchText}
            onChange={onChangeSearchInput}
          />
        </div>
      )}

      <div className={`${classBase}-scrollContainer vuuScrollable`}>
        {layout === 'v-selected-available' ? (
          <>
            {selectedList}
            {availableList}
          </>
        ) : (
          <>
            {availableList}
            {selectedList}
          </>
        )}
      </div>
    </div>
  );
});
