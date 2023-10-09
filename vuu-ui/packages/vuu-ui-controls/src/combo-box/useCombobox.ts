import { InputProps, useControlled } from "@salt-ds/core";
import { useLayoutEffectSkipFirst } from "@finos/vuu-layout";
import {
  ChangeEvent,
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
  RefObject,
  SyntheticEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import {
  hasSelection,
  itemToString as defaultItemToString,
  SelectionChangeHandler,
} from "../common-hooks";
import {
  DropdownHookProps,
  DropdownHookResult,
  OpenChangeHandler,
} from "../dropdown";
import { ListHookProps, ListHookResult, useList } from "../list";

const EnterOnly = ["Enter"];

export interface ComboboxHookProps<Item>
  extends Partial<Omit<DropdownHookProps, "id" | "onKeyDown">>,
    Pick<InputProps, "onBlur" | "onChange" | "onFocus" | "onSelect">,
    Omit<ListHookProps<Item>, "containerRef" | "onSelect"> {
  InputProps?: InputProps;
  allowFreeText?: boolean;
  ariaLabel?: string;
  defaultValue?: string;
  id: string;
  initialHighlightedIndex?: number;
  itemCount: number;
  itemToString?: (item: Item) => string;
  listRef: RefObject<HTMLDivElement>;
  stringToItem?: (value?: string) => Item | null | undefined;
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

export const useCombobox = <Item>({
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
  itemToString = defaultItemToString as (item: Item) => string,
  listRef,
  onOpenChange,
  onSelectionChange,
  selected: selectedProp,
  selectionStrategy,
  stringToItem,
  value: valueProp,
  InputProps: inputProps = {
    onBlur,
    onFocus,
    onChange,
    onSelect,
  },
}: ComboboxHookProps<Item>): ComboboxHookResult<Item> => {
  const isMultiSelect =
    selectionStrategy === "multiple" || selectionStrategy === "extended";

  const { setFilterPattern, stringToCollectionItem } = collectionHook;
  const setHighlightedIndexRef = useRef<null | ((i: number) => void)>(null);
  // used to track multi selection
  const selectedRef = useRef<Item[]>();
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
    default: defaultValue ?? "",
    name: "ComboBox",
    state: "value",
  });

  const [disableAriaActiveDescendant, setDisableAriaActiveDescendant] =
    useState(true);

  const highlightSelectedItem = useCallback((selected) => {
    console.log("highlightSelectedItem");
    if (Array.isArray(selected)) {
      console.log("TODO multi selection");
    } else if (selected == null) {
      setHighlightedIndexRef.current?.(-1);
    } else {
      // const indexOfSelectedItem = indexPositions.indexOf(selected);
      // setHighlightedIndexRef.current?.(indexOfSelectedItem);
    }
  }, []);

  const setTextValue = useCallback(
    (value: string) => {
      setValue(value);
      setFilterPattern(value === "" ? undefined : value);
    },
    [setFilterPattern, setValue]
  );

  const reconcileInput = useCallback(
    (selected?: Item[]) => {
      console.log(`reconcile input`, {
        selected,
      });
      let value = "";
      if (Array.isArray(selected)) {
        if (selected.length === 1) {
          value = itemToString(selected[0]);
        } else {
          value = `${selected.length} items selected`;
        }
      }
      setTextValue(value);
      // if (value === "") {
      //   setHighlightedIndexRef.current?.(-1);
      // } else {
      //   highlightSelectedItem(selected);
      // }
    },
    [itemToString, setTextValue]
  );

  const applySelection = useCallback(() => {
    const { current: selected } = selectedRef;
    reconcileInput(selected);
    onSelectionChange?.(null, selected);
  }, [onSelectionChange, reconcileInput]);

  const handleOpenChange = useCallback<OpenChangeHandler>(
    (open, closeReason) => {
      setIsOpen(open);
      onOpenChange?.(open);
      if (!open && closeReason !== "Escape") {
        applySelection();
      }
    },
    [applySelection, onOpenChange, setIsOpen]
  );

  const handleSelectionChange = useCallback<SelectionChangeHandler<Item>>(
    (evt, selected) => {
      selectedRef.current = selected;
      if (!isMultiSelect) {
        handleOpenChange(false, "select");
      }
    },
    [handleOpenChange, isMultiSelect]
  );

  const handleInputKeyDown = useCallback(
    (evt: KeyboardEvent) => {
      if ("Escape" === evt.key) {
        if (allowFreeText) {
          setTextValue("");
        } else {
          console.log(`call reconcile input from handleInputKeyDown`);

          reconcileInput();
        }
      } else if ("Tab" === evt.key) {
        if (!allowFreeText) {
          console.log(`call reconcile input from handleInputKeyDown`);
          reconcileInput();
        }
      }
    },
    [allowFreeText, reconcileInput, setTextValue]
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
  } = useList<Item>({
    collectionHook,
    containerRef: listRef,
    defaultHighlightedIndex: initialHighlightedIndex,
    defaultSelected,
    disableAriaActiveDescendant,
    disableHighlightOnFocus: true,
    disableTypeToSelect: true,
    label: "useComboBox",
    onKeyboardNavigation: handleKeyboardNavigation,
    onKeyDown: handleInputKeyDown,
    onSelectionChange: handleSelectionChange,
    selected: selectedProp,
    selectionKeys: EnterOnly,
    selectionStrategy,
    tabToSelect: !isMultiSelect,
  });

  setHighlightedIndexRef.current = setHighlightedIndex;
  setSelectedRef.current = setSelected;

  const { onClick: listHandlersOnClick } = listHookListHandlers;
  const handleListClick = useCallback(
    (evt: MouseEvent) => {
      //TODO use ref
      document.getElementById(`${id}-input`)?.focus();
      // const inputEl = inputRef.current;
      listHandlersOnClick?.(evt);
      // if (inputEl != null) {
      //   inputEl.focus();
      // }

      // if (restListProps.onClick) {
      //   restListProps.onClick(event as MouseEvent<HTMLDivElement>);
      // }
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
        onSelectionChange?.(evt, []);
      }

      setIsOpen(true);
    },
    [onSelectionChange, setFilterPattern, setIsOpen, setValue]
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
  const selectInputValue = useCallback(
    (evt: ChangeEvent) => {
      const text = value.trim();
      if (text) {
        const selectedCollectionItem = stringToCollectionItem(text);
        if (selectedCollectionItem) {
          if (Array.isArray(selectedCollectionItem)) {
            // TODO multi select
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
          } else if (selectedCollectionItem !== selected) {
            // given that this happens on blur, do we ned to worry aboyut setting the list vaue ?
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            setSelectedRef.current?.(selectedCollectionItem);
            onSelectionChange?.(evt, selectedCollectionItem.value);
          }
        } else if (stringToItem) {
          const item = stringToItem(text);
          if (item) {
            console.log("we have a new item");
          }
        }
        // Hoiw do we check if string is Item
      }
    },
    [onSelectionChange, selected, stringToItem, stringToCollectionItem, value]
  );

  const { onBlur: inputOnBlur = onBlur } = inputProps;
  const { onBlur: listOnBlur } = listControlProps;
  const handleInputBlur = useCallback(
    (evt: FocusEvent<HTMLInputElement>) => {
      if (listFocused(evt)) {
        // nothing doing
      } else {
        listOnBlur?.(evt);
        inputOnBlur?.(evt);
        if (allowFreeText) {
          selectInputValue(evt as ChangeEvent);
        }
        setDisableAriaActiveDescendant(true);
        ignoreSelectOnFocus.current = true;
      }
    },
    [listFocused, listOnBlur, inputOnBlur, allowFreeText, selectInputValue]
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
    if (itemCount === 0) {
      setIsOpen(false);
    }
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
