import { useId } from "@finos/vuu-utils";
import { Input, InputProps } from "@salt-ds/core";
import {
  ForwardedRef,
  forwardRef,
  ReactElement,
  useCallback,
  useRef,
} from "react";
import {
  CollectionProvider,
  ComponentSelectionProps,
  itemToString as defaultItemToString,
  SelectionStrategy,
  useCollectionItems,
} from "../common-hooks";
import { DropdownBase, DropdownBaseProps } from "../dropdown";
import { List, ListProps } from "../list";
import { ChevronIcon } from "../list/ChevronIcon";
import { useCombobox } from "./useCombobox";

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
  ListProps?: Omit<ListProps<Item>, "ListItem" | "itemToString" | "source">;
  allowBackspaceClearsSelection?: boolean;
  allowFreeText?: boolean;
  defaultValue?: string;
  getFilterRegex?: (inputValue: string) => RegExp;
  initialHighlightedIndex?: number;
  itemsToString?: (items: Item[]) => string;
  onDeselect?: () => void;
  onSetSelectedText?: (text: string) => void;
  disableFilter?: boolean;
  value?: string;
}

//TODO does not cutrrently support controlled vallue

export const ComboBox = forwardRef(function Combobox<
  Item = string,
  S extends SelectionStrategy = "default"
>(
  {
    InputProps,
    ListProps,
    PopupProps,
    ListItem,
    "aria-label": ariaLabel,
    allowBackspaceClearsSelection,
    allowFreeText,
    children,
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
    getFilterRegex,
    id: idProp,
    initialHighlightedIndex = -1,
    isOpen: isOpenProp,
    itemToString = defaultItemToString,
    itemsToString,
    onDeselect,
    onOpenChange: onOpenChangeProp,
    onSelectionChange,
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
  const listRef = useRef<HTMLDivElement>(null);

  const valueFromSelected = (item: Item | null | Item[]) => {
    return Array.isArray(item) && item.length > 0 ? item[0] : undefined;
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

    return item ? itemToString(item) : "";
  };

  const initialValue = getInitialValue(selectedProp, defaultSelected);

  const collectionHook = useCollectionItems<Item>({
    id,
    source,
    children,
    options: {
      disableFilter,
      filterPattern: initialValue,
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
  } = useCombobox<Item, S>({
    InputProps,
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
    listRef,
    onBlur,
    onDeselect,
    onFocus,
    onChange,
    onSelect,
    id,
    isOpen: isOpenProp,
    itemToString,
    itemsToString,
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
      />
    );

  return (
    <CollectionProvider<Item> collectionHook={collectionHook}>
      <DropdownBase
        {...props}
        PopupProps={PopupProps}
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

        <List<Item, S>
          {...ListProps}
          ListItem={ListItem}
          defaultSelected={undefined}
          focusVisible={focusVisible}
          highlightedIndex={highlightedIndex}
          itemTextHighlightPattern={String(inputProps.value) || undefined}
          listHandlers={listHandlers}
          onSelectionChange={onSelectionChange}
          ref={listRef}
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
