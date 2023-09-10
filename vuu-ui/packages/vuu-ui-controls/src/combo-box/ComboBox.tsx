import { useId } from "@finos/vuu-layout";
import { Input, InputProps } from "@salt-ds/core";
import {
  ForwardedRef,
  forwardRef,
  ReactElement,
  useCallback,
  useRef,
} from "react";
import {
  CollectionItem,
  CollectionProvider,
  SelectionProps,
  SelectionStrategy,
  SingleSelectionStrategy,
  useCollectionItems,
} from "../common-hooks";
import { DropdownBase, DropdownBaseProps } from "../dropdown";
import { List, ListProps } from "../list";
import { useCombobox } from "./useCombobox";
import { ChevronIcon } from "../list/ChevronIcon";

export interface ComboBoxProps<
  Item = string,
  Selection extends SelectionStrategy = "default"
> extends Omit<
      DropdownBaseProps,
      "triggerComponent" | "onBlur" | "onChange" | "onFocus"
    >,
    Pick<InputProps, "onBlur" | "onChange" | "onFocus" | "onSelect">,
    Pick<
      ListProps<Item, Selection>,
      "ListItem" | "itemToString" | "source" | "width"
    >,
    Pick<
      SelectionProps<Item, Selection>,
      "onSelectionChange" | "selectionStrategy"
    > {
  InputProps?: InputProps;
  ListProps?: Omit<
    ListProps<Item, Selection>,
    "ListItem" | "itemToString" | "source"
  >;
  allowFreeText?: boolean;
  defaultValue?: string;
  getFilterRegex?: (inputValue: string) => RegExp;
  initialHighlightedIndex?: number;
  stringToItem?: (value?: string) => Item | null | undefined;
  value?: string;
}

//TODO does not cutrrently support controlled vallue

export const ComboBox = forwardRef(function Combobox<
  Item = string,
  Selection extends SelectionStrategy = "default"
>(
  {
    InputProps,
    ListProps,
    ListItem,
    "aria-label": ariaLabel,
    allowFreeText,
    children,
    defaultIsOpen,
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
    selectionStrategy,
    source,
    stringToItem,
    value: valueProp,
    width = 180,
    ...props
  }: ComboBoxProps<Item, Selection>,
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
  } = useCombobox<Item, Selection>({
    InputProps,
    allowFreeText,
    ariaLabel,
    collectionHook,
    defaultIsOpen,
    defaultValue,
    disabled,
    initialHighlightedIndex,
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
    selectionStrategy,
    stringToItem,
    value: valueProp,
  });

  console.log({ inputProps, endAdornmentProp });

  const collectionItemsToItem = useCallback(
    (
      sel?: CollectionItem<Item> | null | CollectionItem<Item>[]
    ):
      | undefined
      | (Selection extends SingleSelectionStrategy ? Item | null : Item[]) => {
      type returnType = Selection extends SingleSelectionStrategy
        ? Item | null
        : Item[];
      if (Array.isArray(sel)) {
        return sel.map((i) => i.value) as returnType;
      } else if (sel) {
        return sel.value as returnType;
      } else {
        return sel as returnType;
      }
    },
    []
  );

  const endAdornment =
    endAdornmentProp === null ? null : (
      <ChevronIcon
        direction={isOpen ? "up" : "down"}
        onClick={() => {
          onOpenChange(!isOpen);
        }}
      />
    );

  console.log({ endAdornment });

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

        <List<Item, Selection>
          {...ListProps}
          ListItem={ListItem}
          focusVisible={focusVisible}
          highlightedIndex={highlightedIndex}
          itemTextHighlightPattern={String(inputProps.value) || undefined}
          id={`${id}-list`}
          listHandlers={listHandlers}
          onSelectionChange={onSelectionChange}
          ref={listRef}
          selected={collectionItemsToItem(selected)}
          selectionStrategy={selectionStrategy}
        />
      </DropdownBase>
    </CollectionProvider>
  );
}) as <Item, Selection extends SelectionStrategy = "default">(
  props: ComboBoxProps<Item, Selection> & {
    ref?: ForwardedRef<HTMLDivElement>;
  }
) => ReactElement<ComboBoxProps<Item, Selection>>;
