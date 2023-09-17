import { useControlled } from "@salt-ds/core";
import { RefObject, useCallback, useMemo } from "react";
import { ListHookProps, ListHookResult, useList } from "../list";
import { DropdownHookResult, DropdownHookProps } from "./dropdownTypes";
import {
  itemToString as defaultItemToString,
  SelectionChangeHandler,
  SelectHandler,
  SelectionStrategy,
} from "../common-hooks";

export interface DropdownListHookProps<Item, Strategy extends SelectionStrategy>
  extends Partial<Omit<DropdownHookProps, "onKeyDown">>,
    Omit<ListHookProps<Item, Strategy>, "containerRef"> {
  itemToString?: (item: Item) => string;
  listRef: RefObject<HTMLDivElement>;
}

export interface DropdownListHookResult<
  Item,
  Selection extends SelectionStrategy
> extends Partial<ListHookResult<Item, Selection>>,
    Partial<DropdownHookResult> {
  onOpenChange: any;
  triggerLabel?: string;
}

export const useDropdown = <
  Item,
  Selection extends SelectionStrategy = "default"
>({
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
}: DropdownListHookProps<Item, Selection>): DropdownListHookResult<
  Item,
  Selection
> => {
  const isMultiSelect =
    selectionStrategy === "multiple" || selectionStrategy === "extended";

  const [isOpen, setIsOpen] = useControlled<boolean>({
    controlled: isOpenProp,
    default: defaultIsOpen ?? false,
    name: "useDropdownList",
  });

  const handleSelectionChange = useCallback<
    SelectionChangeHandler<Item, Selection>
  >(
    (evt, selected) => {
      if (!isMultiSelect) {
        setIsOpen(false);
        onOpenChange?.(false);
      }
      onSelectionChange?.(evt, selected);
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

  const listHook = useList<Item, Selection>({
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
    if (isMultiSelect && Array.isArray(listHook.selected)) {
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
    } else {
      const selectedItem = listHook.selected as string;
      return selectedItem == null
        ? undefined
        : itemToString(collectionHook.itemById(selectedItem));
    }
  }, [collectionHook, isMultiSelect, itemToString, listHook.selected]);

  return {
    isOpen,
    onOpenChange: handleOpenChange,
    triggerLabel,
    ...listHook,
  };
};
