import { useId } from "@finos/vuu-layout";
import { Input, InputProps } from "@salt-ds/core";
import {
  ForwardedRef,
  forwardRef,
  ReactElement,
  useCallback,
  useRef,
} from "react";
import { CollectionProvider, useCollectionItems } from "../common-hooks";
import { DropdownBase, DropdownBaseProps } from "../dropdown";
import { List, ListProps } from "../list";
import { useCombobox } from "./useCombobox";
import { ChevronIcon } from "../list/ChevronIcon";

export interface ComboBoxProps<Item = string>
  extends Omit<
      DropdownBaseProps,
      "triggerComponent" | "onBlur" | "onChange" | "onFocus"
    >,
    Pick<InputProps, "onBlur" | "onChange" | "onFocus" | "onSelect">,
    Pick<
      ListProps<Item>,
      | "ListItem"
      | "defaultSelected"
      | "itemToString"
      | "onSelectionChange"
      | "selected"
      | "selectionStrategy"
      | "source"
      | "width"
    > {
  InputProps?: InputProps;
  ListProps?: Omit<ListProps<Item>, "ListItem" | "itemToString" | "source">;
  allowFreeText?: boolean;
  defaultValue?: string;
  getFilterRegex?: (inputValue: string) => RegExp;
  initialHighlightedIndex?: number;
  stringToItem?: (value?: string) => Item | null | undefined;
  value?: string;
}

//TODO does not cutrrently support controlled vallue

export const ComboBox = forwardRef(function Combobox<Item = string>(
  {
    InputProps,
    ListProps,
    ListItem,
    "aria-label": ariaLabel,
    allowFreeText,
    children,
    defaultIsOpen,
    defaultSelected,
    defaultValue,
    disabled,
    onBlur,
    onFocus,
    onChange,
    onSelect,
    getFilterRegex,
    id: idProp,
    initialHighlightedIndex = -1,
    isOpen: isOpenProp,
    itemToString,
    onOpenChange: onOpenChangeProp,
    onSelectionChange,
    selected: selectedProp,
    selectionStrategy,
    source,
    stringToItem,
    value: valueProp,
    width = 180,
    ...props
  }: ComboBoxProps<Item>,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const id = useId(idProp);
  const listRef = useRef<HTMLDivElement>(null);

  const collectionHook = useCollectionItems<Item>({
    id,
    source,
    children,
    options: {
      filterPattern: valueProp ?? defaultValue,
      getFilterRegex,
      itemToString,
    },
  });

  const {
    focusVisible,
    highlightedIndex,
    inputProps: { endAdornment: endAdornmentProp, ...inputProps },
    isOpen,
    listHandlers,
    listControlProps: controlProps,
    onOpenChange,
    selected,
  } = useCombobox<Item>({
    InputProps,
    allowFreeText,
    ariaLabel,
    collectionHook,
    defaultIsOpen,
    defaultSelected: collectionHook.itemToCollectionItemId(defaultSelected),
    defaultValue,
    disabled,
    initialHighlightedIndex,
    itemCount: collectionHook.data.length,
    listRef,
    onBlur,
    onFocus,
    onChange,
    onSelect,
    id,
    isOpen: isOpenProp,
    itemToString,
    label: "ComboBox",
    onOpenChange: onOpenChangeProp,
    onSelectionChange,
    selected: collectionHook.itemToCollectionItemId(selectedProp),
    selectionStrategy,
    stringToItem,
    value: valueProp,
  });

  const collectionItemsToItem = useCallback(
    (itemIdOrItemIds?: any) => {
      if (Array.isArray(itemIdOrItemIds)) {
        return itemIdOrItemIds.map((id) => collectionHook.itemById(id));
      } else if (itemIdOrItemIds) {
        return collectionHook.itemById(itemIdOrItemIds);
      }
    },
    [collectionHook]
  );

  const handleDropdownIconClick = useCallback(() => {
    if (isOpen) {
      onOpenChange(false, "toggle");
    } else {
      onOpenChange(true);
    }
  }, [isOpen, onOpenChange]);

  const endAdornment =
    endAdornmentProp === null ? null : (
      <ChevronIcon
        direction={isOpen ? "up" : "down"}
        onClick={handleDropdownIconClick}
      />
    );

  return (
    <CollectionProvider<Item> collectionHook={collectionHook}>
      <DropdownBase
        {...props}
        fullWidth
        id={id}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        openOnFocus
        ref={forwardedRef}
        width={width}
      >
        <Input
          {...inputProps}
          disabled={disabled}
          // ref={useForkRef(setInputRef, setHookInputRef)}
          {...controlProps}
          endAdornment={endAdornment}
        />

        <List<Item>
          {...ListProps}
          ListItem={ListItem}
          focusVisible={focusVisible}
          highlightedIndex={highlightedIndex}
          itemTextHighlightPattern={String(inputProps.value) || undefined}
          id={`${id}-list`}
          listHandlers={listHandlers}
          onSelectionChange={onSelectionChange}
          ref={listRef}
          selected={collectionItemsToItem(selected as any)}
          selectionStrategy={selectionStrategy}
        />
      </DropdownBase>
    </CollectionProvider>
  );
}) as <Item>(
  props: ComboBoxProps<Item> & {
    ref?: ForwardedRef<HTMLDivElement>;
  }
) => ReactElement<ComboBoxProps<Item>>;
