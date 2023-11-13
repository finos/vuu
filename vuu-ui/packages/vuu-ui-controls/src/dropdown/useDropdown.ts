import { useControlled } from "@salt-ds/core";
import { RefObject, useCallback, useMemo } from "react";
import { ListHookProps, ListHookResult, useList } from "../list";
import { DropdownHookResult, DropdownHookProps } from "./dropdownTypes";
import {
  itemToString as defaultItemToString,
  SelectHandler,
  SelectionStrategy,
  isMultiSelection,
  MultiSelectionHandler,
  SingleSelectionHandler,
} from "../common-hooks";

export interface DropdownListHookProps<
  Item,
  S extends SelectionStrategy = "default"
> extends Partial<Omit<DropdownHookProps, "onKeyDown">>,
    Omit<ListHookProps<Item, S>, "containerRef"> {
  itemToString?: (item: Item) => string;
  listRef: RefObject<HTMLDivElement>;
}

export interface DropdownListHookResult<Item>
  extends Partial<ListHookResult<Item>>,
    Partial<DropdownHookResult> {
  onOpenChange: any;
  triggerLabel?: string;
}

export const useDropdown = <Item, S extends SelectionStrategy>({
  collectionHook,
  defaultHighlightedIndex: defaultHighlightedIndexProp,
  defaultIsOpen,
  defaultSelected,
  highlightedIndex: highlightedIndexProp,
  isOpen: isOpenProp,
  itemToString = defaultItemToString,
  listRef,
  onHighlight,
  onOpenChange,
  onSelectionChange,
  onSelect,
  selected,
  selectionStrategy,
}: DropdownListHookProps<Item, S>): DropdownListHookResult<Item> => {
  const isMultiSelect = isMultiSelection(selectionStrategy);

  const [isOpen, setIsOpen] = useControlled<boolean>({
    controlled: isOpenProp,
    default: defaultIsOpen ?? false,
    name: "useDropdownList",
  });

  const handleSelectionChange = useCallback(
    (evt, selected) => {
      if (!isMultiSelect) {
        setIsOpen(false);
        onOpenChange?.(false);
      }
      if (Array.isArray(selected)) {
        (onSelectionChange as MultiSelectionHandler<Item>)?.(
          evt,
          selected as Item[]
        );
      } else if (selected) {
        (onSelectionChange as SingleSelectionHandler<Item>)?.(
          evt,
          selected as Item
        );
      }
    },
    [isMultiSelect, onOpenChange, onSelectionChange, setIsOpen]
  );

  const handleSelect = useCallback<SelectHandler<Item>>(
    (evt, selected) => {
      if (!isMultiSelect) {
        setIsOpen(false);
        onOpenChange?.(false);
      }
      onSelect?.(evt, selected);
    },
    [isMultiSelect, onOpenChange, onSelect, setIsOpen]
  );

  const listHook = useList<Item, S>({
    collectionHook,
    defaultHighlightedIndex:
      defaultHighlightedIndexProp ?? highlightedIndexProp === undefined
        ? 0
        : undefined,
    defaultSelected,
    label: "DropDown",
    onSelectionChange: handleSelectionChange,
    onSelect: handleSelect,
    containerRef: listRef,
    highlightedIndex: highlightedIndexProp,
    onHighlight,
    selected,
    selectionStrategy,
    tabToSelect: !isMultiSelect,
  });

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      onOpenChange?.(open);
    },
    [onOpenChange, setIsOpen]
  );

  const triggerLabel = useMemo(() => {
    if (Array.isArray(listHook.selected)) {
      const selectedItems = listHook.selected.map((id) =>
        collectionHook.itemById(id)
      );
      if (selectedItems.length === 0) {
        return undefined;
      } else if (selectedItems.length === 1) {
        const [item] = selectedItems;
        return item === null ? undefined : itemToString(item);
      } else {
        return `${selectedItems.length} items selected`;
      }
    }
  }, [collectionHook, itemToString, listHook.selected]);

  return {
    isOpen,
    onOpenChange: handleOpenChange,
    triggerLabel,
    ...listHook,
  };
};
