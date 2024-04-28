import { useId } from "@finos/vuu-utils";
import { Input, InputProps } from "@salt-ds/core";
import { ForwardedRef, forwardRef, ReactElement, useCallback } from "react";
import {
  CollectionProvider,
  ComponentSelectionProps,
  isMultiSelection,
  itemToString as defaultItemToString,
  SelectionStrategy,
  useCollectionItems,
} from "../common-hooks";
import { DropdownBase, DropdownBaseProps } from "../dropdown";
import { List, ListProps } from "../list";
import { ChevronIcon } from "../list/ChevronIcon";
import { useCombobox } from "./useCombobox";
import cx from "clsx";

const classBase = "vuuCombobox";

//TODO why do we need onSelect from input ?
export interface ComboBoxProps<
  Item = string,
  S extends SelectionStrategy = "default"
> extends Omit<
      DropdownBaseProps,
      "triggerComponent" | "onBlur" | "onChange" | "onFocus"
    >,
    Pick<InputProps, "onBlur" | "onChange" | "onFocus" | "onSelect">,
    Omit<ComponentSelectionProps<Item, S>, "onSelect">,
    Pick<ListProps<Item, S>, "ListItem" | "itemToString" | "source" | "width"> {
  InputProps?: InputProps;
  ListProps?: Omit<
    ListProps<Item>,
    "ListItem" | "itemToString" | "source" | "onSelect" | "onSelectionChange"
  >;
  allowBackspaceClearsSelection?: boolean;
  allowEnterCommitsText?: boolean;
  allowFreeText?: boolean;
  defaultValue?: string;
  getFilterRegex?: (inputValue: string) => RegExp;
  initialHighlightedIndex?: number;
  itemsToString?: (items: Item[]) => string;
  onDeselect?: () => void;
  onSetSelectedText?: (text: string) => void;
  onListItemSelect?: ListProps<Item, S>["onSelect"];
  disableFilter?: boolean;
  value?: string;
}

//TODO does not cutrrently support controlled vallue

export const ComboBox = forwardRef(function Combobox<
  Item = string,
  S extends SelectionStrategy = "default"
>(
  {
    InputProps: InputPropsProp,
    ListProps,
    PopupProps,
    ListItem,
    "aria-label": ariaLabel,
    allowBackspaceClearsSelection,
    allowEnterCommitsText,
    allowFreeText,
    children,
    className,
    defaultIsOpen,
    defaultSelected,
    defaultValue,
    disabled,
    disableFilter,
    onBlur,
    onFocus,
    onChange,
    onSelect,
    onSetSelectedText,
    openOnFocus = true,
    getFilterRegex,
    id: idProp,
    initialHighlightedIndex = -1,
    isOpen: isOpenProp,
    itemToString = defaultItemToString,
    itemsToString,
    onDeselect,
    onOpenChange: onOpenChangeProp,
    onSelectionChange,
    onListItemSelect,
    selected: selectedProp,
    selectionKeys,
    selectionStrategy,
    source,
    value: valueProp,
    width = 180,
    ...props
  }: ComboBoxProps<Item, S>,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const id = useId(idProp);
  const isMultiSelect = isMultiSelection(selectionStrategy);

  const valueFromSelected = (item: Item | null | Item[]) => {
    return Array.isArray(item)
      ? itemsToString?.(item) ?? item[0]
      : item ?? undefined;
  };

  const getInitialValue = (
    items1?: ComboBoxProps<Item, S>["selected"],
    items2?: ComboBoxProps<Item, S>["defaultSelected"]
  ) => {
    const item = items1
      ? valueFromSelected(items1)
      : items2
      ? valueFromSelected(items2)
      : undefined;

    return typeof item === "string" ? item : item ? itemToString(item) : "";
  };

  const initialValue = getInitialValue(selectedProp, defaultSelected);

  const collectionHook = useCollectionItems<Item>({
    id,
    source,
    children,
    options: {
      disableFilter,
      filterPattern: isMultiSelect ? undefined : initialValue,
      getFilterRegex,
      itemToString,
    },
  });

  const {
    focusVisible,
    highlightedIndex,
    InputProps: { endAdornment: endAdornmentProp, ...InputProps },
    isOpen,
    listHandlers,
    listControlProps: controlProps,
    onOpenChange,
    selected,
    setContainerRef,
  } = useCombobox<Item, S>({
    InputProps: InputPropsProp,
    allowEnterCommitsText,
    allowBackspaceClearsSelection,
    allowFreeText,
    ariaLabel,
    collectionHook,
    defaultIsOpen,
    defaultSelected,
    defaultValue,
    disabled,
    initialHighlightedIndex,
    itemCount: collectionHook.data.length,
    label: props.title,
    onBlur,
    onDeselect,
    onFocus,
    onChange,
    onSelect,
    id,
    isOpen: isOpenProp,
    itemToString,
    itemsToString,
    onListItemSelect,
    onOpenChange: onOpenChangeProp,
    onSelectionChange,
    onSetSelectedText,
    selected: selectedProp,
    selectionKeys,
    selectionStrategy,
    value: initialValue,
  });

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
        role="button"
      />
    );

  return (
    <CollectionProvider<Item> collectionHook={collectionHook}>
      <DropdownBase
        {...props}
        PopupProps={PopupProps}
        className={cx(classBase, className)}
        id={id}
        isOpen={isOpen && collectionHook.data.length > 0}
        onOpenChange={onOpenChange}
        openOnFocus={openOnFocus}
        ref={forwardedRef}
        width={width}
      >
        <Input
          {...InputProps}
          disabled={disabled}
          {...controlProps}
          endAdornment={endAdornment}
        />

        <List<Item, S>
          {...ListProps}
          ListItem={ListItem}
          defaultSelected={undefined}
          focusVisible={focusVisible}
          highlightedIndex={highlightedIndex}
          itemTextHighlightPattern={String(InputProps.value) || undefined}
          listHandlers={listHandlers}
          onSelectionChange={onSelectionChange} // not really needed, since onClick in listHandlers will be used instead.
          ref={setContainerRef}
          selected={selected}
          selectionStrategy={selectionStrategy}
          tabIndex={-1}
        />
      </DropdownBase>
    </CollectionProvider>
  );
}) as <Item, S extends SelectionStrategy = "default">(
  props: ComboBoxProps<Item, S> & {
    ref?: ForwardedRef<HTMLDivElement>;
  }
) => ReactElement<ComboBoxProps<Item>>;
