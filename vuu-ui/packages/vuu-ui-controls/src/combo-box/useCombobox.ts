import { InputProps, useControlled } from "@salt-ds/core";
import { useLayoutEffectSkipFirst } from "@finos/vuu-layout";
import {
  ChangeEvent,
  FocusEvent,
  MouseEvent,
  RefObject,
  SyntheticEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import {
  ComponentSelectionProps,
  hasSelection,
  isMultiSelection,
  itemToString as defaultItemToString,
  MultiSelectionHandler,
  SelectionStrategy,
  SelectionType,
  SingleSelectionHandler,
} from "../common-hooks";
import {
  DropdownHookProps,
  DropdownHookResult,
  OpenChangeHandler,
} from "../dropdown";
import { ListHookProps, ListHookResult, useList } from "../list";

const EnterOnly = ["Enter"];

export interface ComboboxHookProps<
  Item = string,
  S extends SelectionStrategy = "default"
> extends Partial<Omit<DropdownHookProps, "id" | "onKeyDown">>,
    Pick<InputProps, "onBlur" | "onChange" | "onFocus" | "onSelect">,
    Omit<ComponentSelectionProps<Item, S>, "onSelect">,
    Omit<
      ListHookProps<Item, S>,
      "containerRef" | "defaultSelected" | "onSelect" | "selected"
    > {
  InputProps?: InputProps;
  allowFreeText?: boolean;
  ariaLabel?: string;
  defaultValue?: string;
  id: string;
  initialHighlightedIndex?: number;
  itemCount: number;
  itemsToString?: (items: Item[]) => string;
  itemToString?: (item: Item) => string;
  listRef: RefObject<HTMLDivElement>;
  onSetSelectedText?: (text: string) => void;
  value?: string;
}

export interface ComboboxHookResult<Item>
  extends Pick<
      ListHookResult<Item>,
      | "focusVisible"
      | "highlightedIndex"
      | "listControlProps"
      | "listHandlers"
      | "selected"
    >,
    Partial<DropdownHookResult> {
  inputProps: InputProps;
  onOpenChange: OpenChangeHandler;
}

export const useCombobox = <Item, S extends SelectionStrategy>({
  allowFreeText,
  ariaLabel,
  collectionHook,
  defaultIsOpen,
  defaultSelected,
  defaultValue,
  onBlur,
  onFocus,
  onChange,
  onSelect,
  id,
  initialHighlightedIndex = -1,
  isOpen: isOpenProp,
  itemCount,
  itemsToString,
  itemToString = defaultItemToString as (item: Item) => string,
  listRef,
  onOpenChange,
  onSelectionChange,
  onSetSelectedText,
  selected: selectedProp,
  selectionStrategy,
  value: valueProp,
  InputProps: inputProps = {
    onBlur,
    onFocus,
    onChange,
    onSelect,
  },
}: ComboboxHookProps<Item, S>): ComboboxHookResult<Item> => {
  const isMultiSelect = isMultiSelection(selectionStrategy);

  const { setFilterPattern } = collectionHook;
  const setHighlightedIndexRef = useRef<null | ((i: number) => void)>(null);
  // used to track multi selection
  const selectedRef = useRef<SelectionType<Item, S>>();
  const setSelectedRef = useRef<null | ListHookResult<Item>["setSelected"]>(
    null
  );
  // Input select events are used to identify user navigation within the input text.
  // The initial select event fired on focus is an exception that we ignore.
  const ignoreSelectOnFocus = useRef(true);
  // const selectedRef = useRef<Item[] | undefined>(
  //   selected ?? defaultSelected ?? []
  // );

  const [isOpen, setIsOpen] = useControlled<boolean>({
    controlled: isOpenProp,
    default: defaultIsOpen ?? false,
    name: "useDropdownList",
  });

  const [value, setValue] = useControlled({
    controlled: undefined,
    default: defaultValue ?? valueProp,
    name: "ComboBox",
    state: "value",
  });

  const [disableAriaActiveDescendant, setDisableAriaActiveDescendant] =
    useState(true);

  const highlightSelectedItem = useCallback((selected) => {
    if (Array.isArray(selected)) {
      console.log("TODO multi selection");
    } else if (selected == null) {
      setHighlightedIndexRef.current?.(-1);
    }
  }, []);

  const setTextValue = useCallback(
    (value: string, applyFilter = true) => {
      setValue(value);
      if (applyFilter) {
        setFilterPattern(value === "" ? undefined : value);
      }
    },
    [setFilterPattern, setValue]
  );

  const reconcileInput = useCallback(
    (selected?: SelectionType<Item, S>) => {
      let newValue = allowFreeText ? value ?? "" : "";
      if (Array.isArray(selected)) {
        if (selected.length === 1) {
          newValue = itemToString(selected[0]);
        } else if (selected.length > 1) {
          newValue = itemsToString?.(selected) || "";
        }
      } else if (selected) {
        newValue = itemToString(selected as Item);
      }
      if (newValue !== value) {
        setTextValue(newValue, !isMultiSelect);
        onSetSelectedText?.(newValue);
      }
    },
    [
      allowFreeText,
      isMultiSelect,
      itemToString,
      itemsToString,
      onSetSelectedText,
      setTextValue,
      value,
    ]
  );

  const applySelection = useCallback(() => {
    const { current: selected } = selectedRef;
    reconcileInput(selected);
    if (selected) {
      // selected ref will be undefined if user has changed nothing
      if (Array.isArray(selected)) {
        (onSelectionChange as MultiSelectionHandler<Item>)?.(
          null,
          selected as Item[]
        );
      } else if (selected) {
        (onSelectionChange as SingleSelectionHandler<Item>)?.(
          null,
          selected as Item
        );
      }
    }
  }, [onSelectionChange, reconcileInput]);

  const handleOpenChange = useCallback<OpenChangeHandler>(
    (open, closeReason) => {
      console.log(`openCHange ${open} ${closeReason}`);
      if (open && isMultiSelect) {
        setTextValue("", false);
      }
      setIsOpen(open);
      onOpenChange?.(open);
      if (!open && closeReason !== "Escape") {
        applySelection();
      }
    },
    [applySelection, isMultiSelect, onOpenChange, setIsOpen, setTextValue]
  );

  const handleSelectionChange = useCallback(
    (evt, selected) => {
      selectedRef.current = selected;
      if (!isMultiSelect) {
        handleOpenChange(false, "select");
      }
    },
    [handleOpenChange, isMultiSelect]
  );

  const handleKeyboardNavigation = useCallback(() => {
    setDisableAriaActiveDescendant(false);
  }, []);

  const {
    focusVisible,
    setHighlightedIndex,
    highlightedIndex,
    listControlProps,
    listHandlers: listHookListHandlers,
    selected,
    setSelected,
  } = useList<Item, S>({
    collectionHook,
    containerRef: listRef,
    defaultHighlightedIndex: initialHighlightedIndex,
    defaultSelected: collectionHook.itemToCollectionItemId(defaultSelected),
    disableAriaActiveDescendant,
    disableHighlightOnFocus: true,
    disableTypeToSelect: true,
    onKeyboardNavigation: handleKeyboardNavigation,
    // onKeyDown: handleInputKeyDown,
    onSelectionChange: handleSelectionChange,
    selected: collectionHook.itemToCollectionItemId(selectedProp),
    selectionKeys: EnterOnly,
    selectionStrategy,
    tabToSelect: !isMultiSelect,
  });

  setHighlightedIndexRef.current = setHighlightedIndex;
  setSelectedRef.current = setSelected;

  const { onClick: listHandlersOnClick } = listHookListHandlers;
  const handleListClick = useCallback(
    (evt: MouseEvent) => {
      document.getElementById(`${id}-input`)?.focus();
      listHandlersOnClick?.(evt);
    },
    [id, listHandlersOnClick]
  );

  const handleInputChange = useCallback(
    (evt: ChangeEvent<HTMLInputElement>) => {
      const newValue = evt.target.value;
      setValue(newValue);

      if (newValue && newValue.trim().length) {
        setFilterPattern(newValue);
      } else {
        setFilterPattern(undefined);
        //        onSelectionChange?.(evt, []);
      }

      setIsOpen(true);
    },
    [setFilterPattern, setIsOpen, setValue]
  );

  const { onFocus: inputOnFocus = onFocus } = inputProps;
  const { onFocus: listOnFocus } = listControlProps;
  const handleInputFocus = useCallback(
    (evt: FocusEvent<HTMLInputElement>) => {
      setDisableAriaActiveDescendant(false);
      listOnFocus?.(evt);
      inputOnFocus?.(evt);
    },
    [inputOnFocus, listOnFocus]
  );

  const listFocused = useCallback(
    (evt: FocusEvent) => {
      const element = evt.relatedTarget as HTMLElement;
      return element?.id === `${id}-list`;
    },
    [id]
  );

  // When focus leaves a free text combo, check to see if the entered text is
  // a valid selection, if so fire a change event
  const selectFreeTextInputValue = useCallback(() => {
    const text = value?.trim();
    const { current: selected } = selectedRef;
    if (text) {
      if (itemCount === 0 && text) {
        // TODO should this be a different event ?
        if (isMultiSelect) {
          (onSelectionChange as MultiSelectionHandler<string>)?.(null, [text]);
        } else {
          (onSelectionChange as SingleSelectionHandler<string>)?.(null, text);
        }
      } else if (selected && !isMultiSelect) {
        if (selected === text) {
          // it has already been selected, nothing to do
        }
      }
    }
  }, [value, itemCount, isMultiSelect, onSelectionChange]);

  const { onBlur: inputOnBlur = onBlur } = inputProps;
  const { onBlur: listOnBlur } = listControlProps;
  const handleInputBlur = useCallback(
    (evt: FocusEvent<HTMLInputElement>) => {
      console.log("input blur");
      if (listFocused(evt)) {
        // nothing doing
      } else {
        listOnBlur?.(evt);
        inputOnBlur?.(evt);
        if (allowFreeText) {
          selectFreeTextInputValue();
        }
        setDisableAriaActiveDescendant(true);
        ignoreSelectOnFocus.current = true;
      }
    },
    [
      listFocused,
      listOnBlur,
      inputOnBlur,
      allowFreeText,
      selectFreeTextInputValue,
    ]
  );

  const { onSelect: inputOnSelect } = inputProps;
  const handleInputSelect = useCallback(
    (event: SyntheticEvent<HTMLDivElement>) => {
      if (ignoreSelectOnFocus.current) {
        ignoreSelectOnFocus.current = false;
      } else {
        setDisableAriaActiveDescendant(true);
      }
      inputOnSelect?.(event);
    },
    [inputOnSelect]
  );

  // If we have selected item(s) and we filter down the list by typing,
  // the position of selected items within the list may be changing.
  // Relocate highlighted index to the selection whenever this happens,
  // so if we resume keyboard navigation, navigation begins from the selected
  // item.
  useLayoutEffectSkipFirst(() => {
    if (hasSelection(selected)) {
      highlightSelectedItem(selected);
    } else {
      setHighlightedIndex(initialHighlightedIndex);
    }
    // TODO may need to scrollIntoView
    // if (itemCount === 0) {
    //   setIsOpen(false);
    // }
  }, [
    highlightSelectedItem,
    itemCount,
    initialHighlightedIndex,
    selected,
    setHighlightedIndex,
    setIsOpen,
  ]);

  // const activeDescendant: string | undefined = selectionChanged
  //   ? ""
  //   : undefined;
  const mergedInputProps = {
    ...inputProps.inputProps,
    // "aria-owns": listId,
    "aria-label": ariaLabel,
    autoComplete: "off",
  };

  return {
    focusVisible,
    highlightedIndex,
    isOpen,
    onOpenChange: handleOpenChange,
    inputProps: {
      ...inputProps,
      // "aria-activedescendant": activeDescendant,
      id: `${id}-input`,
      inputProps: mergedInputProps,
      onChange: handleInputChange,
      onSelect: handleInputSelect,
      role: "combobox",
      value,
    },
    listControlProps: {
      ...listControlProps,
      onBlur: handleInputBlur,
      onFocus: handleInputFocus,
    },
    listHandlers: {
      ...listHookListHandlers,
      onClick: handleListClick,
    },
    selected,
  };
};
