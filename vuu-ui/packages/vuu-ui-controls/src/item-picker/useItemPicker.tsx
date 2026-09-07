<<<<<<< HEAD
<<<<<<< HEAD
import { queryClosest, reorderItems } from "@vuu-ui/vuu-utils";
=======
>>>>>>> 0d00a9699 (First version of ItemPicker as a controlled component)
=======
import { queryClosest, reorderItems } from "@vuu-ui/vuu-utils";
>>>>>>> 184c859dd (Updates to address review comments on ItemPicker, additional fix for search logic to search label, else name)
import {
  FormEventHandler,
  MouseEventHandler,
  useCallback,
  useMemo,
<<<<<<< HEAD
<<<<<<< HEAD
  useState,
} from "react";
=======
} from "react";
import { reorderColumnItems as reorderItems } from "@vuu-ui/vuu-utils";
import { queryClosest } from "@vuu-ui/vuu-utils";
>>>>>>> 0d00a9699 (First version of ItemPicker as a controlled component)
=======
  useState,
} from "react";
>>>>>>> 184c859dd (Updates to address review comments on ItemPicker, additional fix for search logic to search label, else name)

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
<<<<<<< HEAD
<<<<<<< HEAD
  maxSelections?: number;
<<<<<<< HEAD
  onSelectedItemsChange: (newSelectedItems: ItemDescriptor[]) => void;
=======
  searchPattern: string;
  onSelectedItemsChange: (newSelectedItems: ItemDescriptor[]) => void;
  onSearchPatternChange: (newSearchPattern: string) => void;
>>>>>>> 0d00a9699 (First version of ItemPicker as a controlled component)
=======
  maxSelections?: number;
  onSelectedItemsChange: (newSelectedItems: ItemDescriptor[]) => void;
>>>>>>> 184c859dd (Updates to address review comments on ItemPicker, additional fix for search logic to search label, else name)
=======
  onSelectedItemsChange: (newSelectedItems: readonly ItemDescriptor[]) => void;
  onSelectedItemsFilteredChange: (
    newSelectedItemsFiltered: readonly ItemDescriptor[],
  ) => void;
>>>>>>> 8a994c732 (Refactor of ColumnPicker to use ItemPicker)
}

const filterItems = (
  items: readonly ItemDescriptor[],
  pattern: string,
): readonly ItemDescriptor[] => {
  if (pattern) {
    const lowerCasePattern = pattern.toLowerCase();
    return items.filter(
<<<<<<< HEAD
<<<<<<< HEAD
      (item) =>
        getItemLabel(item).toLowerCase().indexOf(lowerCasePattern) !== -1,
=======
      ({ name }) => name.toLowerCase().indexOf(lowerCasePattern) !== -1,
>>>>>>> 0d00a9699 (First version of ItemPicker as a controlled component)
=======
      (item) =>
        getItemLabel(item).toLowerCase().indexOf(lowerCasePattern) !== -1,
>>>>>>> 184c859dd (Updates to address review comments on ItemPicker, additional fix for search logic to search label, else name)
    );
  } else {
    return items;
  }
};

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 184c859dd (Updates to address review comments on ItemPicker, additional fix for search logic to search label, else name)
export const getItemLabel = (item: ItemDescriptor) => {
  if (item.label) return item.label;
  else return item.name;
};

<<<<<<< HEAD
=======
>>>>>>> 0d00a9699 (First version of ItemPicker as a controlled component)
=======
>>>>>>> 184c859dd (Updates to address review comments on ItemPicker, additional fix for search logic to search label, else name)
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
<<<<<<< HEAD
<<<<<<< HEAD
  maxSelections,
  onSelectedItemsChange,
  onSelectedItemsFilteredChange,
}: ItemPickerHookProps) => {
  if (maxSelections && selectedItems.length > maxSelections) {
    throw Error(
      `[useItemPicker] max selections ${maxSelections} exceeded by selected items (that has count ${selectedItems.length})`,
    );
  }

  const [searchPattern, setSearchPattern] = useState("");

<<<<<<< HEAD
  const handleChangeSearchInput = useCallback<FormEventHandler>((evt) => {
    const { value } = evt.target as HTMLInputElement;
    setSearchPattern(value);
=======
  searchPattern,
=======
  maxSelections,
>>>>>>> 184c859dd (Updates to address review comments on ItemPicker, additional fix for search logic to search label, else name)
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
<<<<<<< HEAD
    onSearchPatternChange(value);
>>>>>>> 0d00a9699 (First version of ItemPicker as a controlled component)
=======
    setSearchPattern(value);
>>>>>>> 184c859dd (Updates to address review comments on ItemPicker, additional fix for search logic to search label, else name)
  }, []);
=======
  const handleChangeSearchInput = useCallback<FormEventHandler>(
    (evt) => {
      const previousFilteredSelections = getSelectedItemsFiltered(
        selectedItems,
        searchPattern,
      );

      const { value } = evt.target as HTMLInputElement;
      setSearchPattern(value);

      // Determine whether the filtered selections have changed
      const newFilteredSelections = getSelectedItemsFiltered(
        selectedItems,
        value,
      );
      if (previousFilteredSelections.length !== newFilteredSelections.length) {
        onSelectedItemsFilteredChange(newFilteredSelections);
      }
    },
    [onSelectedItemsFilteredChange, selectedItems, searchPattern],
  );
>>>>>>> 8a994c732 (Refactor of ColumnPicker to use ItemPicker)

  const handleAddItemToSelectedList = useCallback<
    MouseEventHandler<HTMLButtonElement>
  >(
    (e) => {
      const name = itemName(e.target);
      const itemToAdd = allItems.find((item) => item.name === name);
      if (itemToAdd) {
<<<<<<< HEAD
<<<<<<< HEAD
        const newSelectedItems = selectedItems.concat(itemToAdd);
=======
        const newSelectedItems = [...selectedItems, itemToAdd];
>>>>>>> 0d00a9699 (First version of ItemPicker as a controlled component)
=======
        const newSelectedItems = selectedItems.concat(itemToAdd);
>>>>>>> 184c859dd (Updates to address review comments on ItemPicker, additional fix for search logic to search label, else name)
        onSelectedItemsChange(newSelectedItems);
        onSelectedItemsFilteredChange(
          getSelectedItemsFiltered(newSelectedItems, searchPattern),
        );
      } else {
        throw Error(
          `[useItemPicker] handleAddItemToSelectedList, item '${name}' not found`,
        );
      }
    },
    [
      allItems,
      selectedItems,
      onSelectedItemsChange,
      onSelectedItemsFilteredChange,
    ],
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
        onSelectedItemsFilteredChange(
          getSelectedItemsFiltered(newSelectedItems, searchPattern),
        );
      } else {
        throw Error(
          `[useItemPicker] handleRemoveItemFromSelectedList, item '${name}' not found`,
        );
      }
    },
    [selectedItems, onSelectedItemsChange, onSelectedItemsFilteredChange],
  );

  const handleReorderSelectedItems = useCallback(
    (orderedItemNames: string[]) => {
<<<<<<< HEAD
<<<<<<< HEAD
      const reorderedSelectedItems: ItemDescriptor[] = reorderItems(
=======
      let reorderedSelectedItems: ItemDescriptor[] = reorderItems(
>>>>>>> 0d00a9699 (First version of ItemPicker as a controlled component)
=======
      const reorderedSelectedItems: ItemDescriptor[] = reorderItems(
>>>>>>> 184c859dd (Updates to address review comments on ItemPicker, additional fix for search logic to search label, else name)
        selectedItems,
        orderedItemNames,
      );
      onSelectedItemsChange(reorderedSelectedItems);
    },
    [selectedItems, onSelectedItemsChange],
  );

<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
  const getSelectedItemsFiltered = useMemo(() => {
    return filterItems(selectedItems, searchPattern);
  }, [selectedItems, searchPattern]);
=======
  const getSelectedItemsFiltered = (
    latestSelectedItems: readonly ItemDescriptor[],
    latestSearchPattern: string,
  ) => {
    return filterItems(latestSelectedItems, latestSearchPattern);
  };
>>>>>>> 8a994c732 (Refactor of ColumnPicker to use ItemPicker)

  const getAvailableItemsFiltered = useMemo(() => {
=======
  const getSelectedItems = useMemo(() => {
    return filterItems(selectedItems, searchPattern);
  }, [selectedItems, searchPattern]);

  const getAvailableItems = useMemo(() => {
>>>>>>> 0d00a9699 (First version of ItemPicker as a controlled component)
=======
  const getSelectedItemsFiltered = useMemo(() => {
    return filterItems(selectedItems, searchPattern);
  }, [selectedItems, searchPattern]);

  const getAvailableItemsFiltered = useMemo(() => {
>>>>>>> 6df1e1e09 (Addition of available items count, this and selected items count always get displayed above lists)
    return filterItems(allItems, searchPattern)
      .filter(
        ({ name }) =>
          selectedItems.findIndex((item) => item.name === name) === -1,
      )
      .toSorted(byItemName);
  }, [allItems, selectedItems, searchPattern]);

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 6df1e1e09 (Addition of available items count, this and selected items count always get displayed above lists)
  const getAvailableItemsCount = useMemo(() => {
    return allItems.filter(
      ({ name }) =>
        selectedItems.findIndex((item) => item.name === name) === -1,
    ).length;
  }, [allItems, selectedItems]);

<<<<<<< HEAD
  return {
    selectedItemsCount: selectedItems.length,
    availableItemsCount: getAvailableItemsCount,
    selectedItemsFiltered: getSelectedItemsFiltered(
      selectedItems,
      searchPattern,
    ),
    availableItemsFiltered: getAvailableItemsFiltered,
=======
  return {
    selectedItemsCount: selectedItems.length,
    selectedItemsFiltered: getSelectedItems,
    availableItemsFiltered: getAvailableItems,
>>>>>>> 0d00a9699 (First version of ItemPicker as a controlled component)
=======
  return {
    selectedItemsCount: selectedItems.length,
    availableItemsCount: getAvailableItemsCount,
    selectedItemsFiltered: getSelectedItemsFiltered,
    availableItemsFiltered: getAvailableItemsFiltered,
>>>>>>> 6df1e1e09 (Addition of available items count, this and selected items count always get displayed above lists)
    searchText: searchPattern,
    onChangeSearchInput: handleChangeSearchInput,
    onAddItemToSelectedList: handleAddItemToSelectedList,
    onRemoveItemFromSelectedList: handleRemoveItemFromSelectedList,
    onReorderSelectedItems: handleReorderSelectedItems,
  };
};
