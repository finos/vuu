import { useLayoutEffectSkipFirst } from "@finos/vuu-utils";
import { InputProps, useControlled } from "@salt-ds/core";
import {
  ChangeEvent,
  FocusEvent,
  KeyboardEventHandler,
  MouseEvent,
  RefCallback,
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
  MultiSelectionStrategy,
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
import { ComboBoxProps } from "./ComboBox";

const EnterOnly = ["Enter"];
export interface ComboboxHookProps<
  Item = string,
  S extends SelectionStrategy = "default"
> extends Partial<Omit<DropdownHookProps, "id" | "onKeyDown">>,
    Pick<InputProps, "onBlur" | "onChange" | "onFocus" | "onSelect">,
    Pick<
      ComboBoxProps<Item>,
      | "allowBackspaceClearsSelection"
      | "allowEnterCommitsText"
      | "allowFreeText"
      | "defaultValue"
      | "initialHighlightedIndex"
      | "itemsToString"
      | "onDeselect"
      | "onSetSelectedText"
      | "onListItemSelect"
      | "value"
    >,
    Omit<ComponentSelectionProps<Item, S>, "onSelect">,
    Omit<
      ListHookProps<Item, S>,
      "containerRef" | "defaultSelected" | "onSelect" | "selected"
    > {
  InputProps?: InputProps;
  ariaLabel?: string;
  id: string;
  itemCount: number;
  itemToString?: (item: Item) => string;
}

export interface ComboboxHookResult<Item, S extends SelectionStrategy>
  extends Pick<
      ListHookResult<Item>,
      "focusVisible" | "highlightedIndex" | "listControlProps" | "listHandlers"
    >,
    Partial<DropdownHookResult> {
  InputProps: InputProps;
  onOpenChange: OpenChangeHandler;
  selected?: S extends MultiSelectionStrategy ? Item[] : Item | null;
  setContainerRef: RefCallback<HTMLDivElement>;
}

export const useCombobox = <Item, S extends SelectionStrategy>({
  allowBackspaceClearsSelection,
  allowEnterCommitsText,
  allowFreeText,
  ariaLabel,
  collectionHook,
  defaultIsOpen,
  defaultSelected,
  defaultValue,
  onBlur,
  onFocus,
  onChange,
  onDeselect,
  onSelect,
  id,
  initialHighlightedIndex = -1,
  isOpen: isOpenProp,
  itemCount,
  itemsToString,
  itemToString = defaultItemToString as (item: Item) => string,
  onListItemSelect,
  onOpenChange,
  onSelectionChange,
  onSetSelectedText,
  selected: selectedProp,
  selectionKeys = EnterOnly,
  selectionStrategy,
  value: valueProp,
  InputProps = {
    onBlur,
    onFocus,
    onChange,
    onSelect,
  },
}: ComboboxHookProps<Item, S>): ComboboxHookResult<Item, S> => {
  const isMultiSelect = isMultiSelection(selectionStrategy);

  const noSelection = () => (isMultiSelect ? [] : null);

  const { setFilterPattern } = collectionHook;
  const setHighlightedIndexRef = useRef<null | ((i: number) => void)>(null);
  const selectedRef = useRef(selectedProp ?? defaultSelected ?? noSelection());
  // Input select events are used to identify user navigation within the input text.
  // The initial select event fired on focus is an exception that we ignore.
  const ignoreSelectOnFocus = useRef(true);

  const [isOpen, _setIsOpen] = useControlled<boolean>({
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

  const setIsOpen = useCallback(
    (isOpen: boolean) => {
      _setIsOpen(isOpen);
      setDisableAriaActiveDescendant(!isOpen);
    },
    [_setIsOpen]
  );

  const highlightSelectedItem = useCallback((selected) => {
    if (Array.isArray(selected)) {
      // TODO multi selection
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
        return true;
      } else {
        return false;
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
    if (reconcileInput(selected as any)) {
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
    }
  }, [onSelectionChange, reconcileInput]);

  const selectFreeTextInputValue = useCallback(() => {
    if (allowFreeText) {
      const text = value?.trim();
      const { current: selected } = selectedRef;
      if (text) {
        if (itemCount === 0 && text) {
          // TODO should this be a different event ?
          if (isMultiSelect) {
            (onSelectionChange as MultiSelectionHandler<string>)?.(null, [
              text,
            ]);
          } else {
            (onSelectionChange as SingleSelectionHandler<string>)?.(null, text);
          }
          selectedRef.current = null;
          return true;
        } else if (selected && !isMultiSelect) {
          if (
            selected &&
            !Array.isArray(selected) &&
            itemToString(selected as Item) === text
          ) {
            // it has already been selected, nothing to do
          }
        }
      }
    }
    return false;
  }, [
    allowFreeText,
    value,
    itemCount,
    isMultiSelect,
    onSelectionChange,
    itemToString,
  ]);

  const handleOpenChange = useCallback<OpenChangeHandler>(
    (open, closeReason) => {
      if (open && isMultiSelect) {
        setTextValue("", false);
      }
      setIsOpen(open);
      onOpenChange?.(open, closeReason);
      if (!open && closeReason !== "Escape") {
        if (!selectFreeTextInputValue()) {
          applySelection();
        }
      }
    },
    [
      applySelection,
      isMultiSelect,
      onOpenChange,
      selectFreeTextInputValue,
      setIsOpen,
      setTextValue,
    ]
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

  const {
    focusVisible,
    setHighlightedIndex,
    highlightedIndex,
    listControlProps,
    listHandlers: listHookListHandlers,
    selected,
    setContainerRef,
  } = useList<Item, S>({
    collectionHook,
    defaultHighlightedIndex: initialHighlightedIndex,
    defaultSelected: collectionHook.itemToCollectionItemId(defaultSelected),
    disableAriaActiveDescendant,
    disableHighlightOnFocus: true,
    disableTypeToSelect: true,
    label: "combobox",
    onSelectionChange: handleSelectionChange,
    onSelect: onListItemSelect,
    selected: collectionHook.itemToCollectionItemId(selectedProp as any),
    selectionKeys,
    selectionStrategy,
    tabToSelect: !isMultiSelect,
  });

  setHighlightedIndexRef.current = setHighlightedIndex;

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

  const handleInputKeyDown = useCallback<
    KeyboardEventHandler<HTMLInputElement>
  >(
    (e) => {
      if (
        e.key === "Enter" &&
        value !== undefined &&
        value !== "" &&
        // TODO this whole allowEnterCommitsText isquestionable
        allowEnterCommitsText
      ) {
        setIsOpen(false);
      }

      InputProps.inputProps?.onKeyDown?.(e);
      if (e.isDefaultPrevented()) {
        // no more to do;
      } else if (e.key === "Backspace" && allowBackspaceClearsSelection) {
        selectedRef.current = null;
        onDeselect?.();
      }
    },
    [
      InputProps.inputProps,
      allowBackspaceClearsSelection,
      allowEnterCommitsText,
      onDeselect,
      setIsOpen,
      value,
    ]
  );

  const { onFocus: inputOnFocus = onFocus } = InputProps;
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

  const { onBlur: inputOnBlur = onBlur } = InputProps;
  const { onBlur: listOnBlur } = listControlProps;
  // TODO do we need this check at all, given that DropdownV=BAse will close dropdown
  const handleInputBlur = useCallback(
    (evt: FocusEvent<HTMLInputElement>) => {
      if (listFocused(evt)) {
        // nothing doing
      } else {
        listOnBlur?.(evt);
        inputOnBlur?.(evt);
        // setDisableAriaActiveDescendant(true);
        ignoreSelectOnFocus.current = true;
      }
    },
    [listFocused, listOnBlur, inputOnBlur]
  );

  const { onSelect: inputOnSelect } = InputProps;
  const handleInputSelect = useCallback(
    (event: SyntheticEvent<HTMLDivElement>) => {
      if (ignoreSelectOnFocus.current) {
        ignoreSelectOnFocus.current = false;
      } else {
        // setDisableAriaActiveDescendant(true);
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
  }, [
    highlightSelectedItem,
    itemCount,
    initialHighlightedIndex,
    selected,
    setHighlightedIndex,
    setIsOpen,
  ]);

  const mergedInputProps = {
    ...InputProps.inputProps,
    "aria-label": ariaLabel,
    autoComplete: "off",
    onKeyDown: handleInputKeyDown,
  };

  return {
    focusVisible,
    highlightedIndex,
    isOpen,
    onOpenChange: handleOpenChange,
    InputProps: {
      ...InputProps,
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
    selected: selectedRef.current as SelectionType<Item, S>,
    setContainerRef,
  };
};
