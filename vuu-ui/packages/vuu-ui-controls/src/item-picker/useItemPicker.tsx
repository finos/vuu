import { queryClosest, reorderItems } from "@vuu-ui/vuu-utils";
import {
  FormEventHandler,
  MouseEventHandler,
  useCallback,
  useMemo,
  useState,
} from "react";

/** This is a public description of an Item that can be displayed in the ItemPicker component, defining all the
 * mandatory and option attributes that can be defined by the client. */
export interface ItemDescriptor {
  /** Unique name for this data value */
  name: string;
  /** Optional label for display instead of the name */
  label?: string;
  /** Optional data-icon name for display of an icon to the left of the item label/name in the selected list */
  icon?: string;
  /** Optional string to define groups of items for client reference, not currently used for rendering */
  group?: string;
}

export interface CreateCustomItemProps {
  buttonLabel: string;
  onClickCreateCustomItem: MouseEventHandler<HTMLButtonElement>;
}

export interface ItemPickerHookProps {
  allItems: ItemDescriptor[];
  selectedItems: ItemDescriptor[];
  maxSelections?: number;
  onSelectedItemsChange: (newSelectedItems: ItemDescriptor[]) => void;
}

const filterItems = (
  items: readonly ItemDescriptor[],
  pattern: string,
): readonly ItemDescriptor[] => {
  if (pattern) {
    const lowerCasePattern = pattern.toLowerCase();
    return items.filter(
      (item) =>
        getItemLabel(item).toLowerCase().indexOf(lowerCasePattern) !== -1,
    );
  } else {
    return items;
  }
};

export const getItemLabel = (item: ItemDescriptor) => {
  if (item.label) return item.label;
  else return item.name;
};

const itemName = (target: EventTarget): string => {
  const listItem = queryClosest(target, ".saltOption", true);
  const { name } = listItem.dataset;
  if (name) {
    return name;
  } else {
    throw Error(
      "[useItemPicker] item name could not be identified, data-name attribute not found",
    );
  }
};

const byItemName = (
  { name: n1 }: ItemDescriptor,
  { name: n2 }: ItemDescriptor,
) => (n1 > n2 ? 1 : n2 > n1 ? -1 : 0);

export const useItemPicker = ({
  allItems,
  selectedItems,
  maxSelections,
  onSelectedItemsChange,
}: ItemPickerHookProps) => {
  if (maxSelections && selectedItems.length > maxSelections) {
    throw Error(
      `[useItemPicker] max selections ${maxSelections} exceeded by selected items (that has count ${selectedItems.length})`,
    );
  }

  const [searchPattern, setSearchPattern] = useState("");

  const handleChangeSearchInput = useCallback<FormEventHandler>((evt) => {
    const { value } = evt.target as HTMLInputElement;
    setSearchPattern(value);
  }, []);

  const handleAddItemToSelectedList = useCallback<
    MouseEventHandler<HTMLButtonElement>
  >(
    (e) => {
      const name = itemName(e.target);
      const itemToAdd = allItems.find((item) => item.name === name);
      if (itemToAdd) {
        const newSelectedItems = selectedItems.concat(itemToAdd);
        onSelectedItemsChange(newSelectedItems);
      } else {
        throw Error(
          `[useItemPicker] handleAddItemToSelectedList, item '${name}' not found`,
        );
      }
    },
    [allItems, selectedItems, onSelectedItemsChange],
  );

  const handleRemoveItemFromSelectedList = useCallback<
    MouseEventHandler<HTMLButtonElement>
  >(
    (e) => {
      const name = itemName(e.target);
      const itemToRemove = selectedItems.find((item) => item.name === name);
      if (itemToRemove) {
        const newSelectedItems = selectedItems.filter(
          (item) => item.name !== name,
        );
        onSelectedItemsChange(newSelectedItems);
      } else {
        throw Error(
          `[useItemPicker] handleRemoveItemFromSelectedList, item '${name}' not found`,
        );
      }
    },
    [selectedItems, onSelectedItemsChange],
  );

  const handleReorderSelectedItems = useCallback(
    (orderedItemNames: string[]) => {
      const reorderedSelectedItems: ItemDescriptor[] = reorderItems(
        selectedItems,
        orderedItemNames,
      );
      onSelectedItemsChange(reorderedSelectedItems);
    },
    [selectedItems, onSelectedItemsChange],
  );

  const getSelectedItems = useMemo(() => {
    return filterItems(selectedItems, searchPattern);
  }, [selectedItems, searchPattern]);

  const getAvailableItems = useMemo(() => {
    return filterItems(allItems, searchPattern)
      .filter(
        ({ name }) =>
          selectedItems.findIndex((item) => item.name === name) === -1,
      )
      .toSorted(byItemName);
  }, [allItems, selectedItems, searchPattern]);

  return {
    selectedItemsCount: selectedItems.length,
    selectedItemsFiltered: getSelectedItems,
    availableItemsFiltered: getAvailableItems,
    searchText: searchPattern,
    onChangeSearchInput: handleChangeSearchInput,
    onAddItemToSelectedList: handleAddItemToSelectedList,
    onRemoveItemFromSelectedList: handleRemoveItemFromSelectedList,
    onReorderSelectedItems: handleReorderSelectedItems,
  };
};
