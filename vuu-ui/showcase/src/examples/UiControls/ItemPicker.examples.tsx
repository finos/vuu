import { MouseEventHandler, useCallback, useMemo, useState } from "react";
import { getSchema } from "@vuu-ui/vuu-data-test";
import {
  CreateCustomItemProps,
  ItemDescriptor,
  ItemPicker,
} from "@vuu-ui/vuu-ui-controls";

interface StatefulParentProps {
  allItems: ItemDescriptor[];
  initialSelectedItems: ItemDescriptor[];
  itemTypeSingular: string;
}

const StatefulParent = ({
  allItems,
  initialSelectedItems,
  itemTypeSingular,
}: StatefulParentProps) => {
  const [selectedItems, setSelectedItems] = useState(initialSelectedItems);
  const [searchPattern, setSearchPattern] = useState("");

  const handleClickCreateCustomItem = useCallback<
    MouseEventHandler<HTMLButtonElement>
  >((e) => {
    console.log("handleClickCreateCustomItem() called");
  }, []);

  const handleSelectedItemsChange = useCallback(
    (newSelectedItems: ItemDescriptor[]) => {
      console.log(
        "handleSelectedItemsChange() called with new item selections: ",
      );

      for (let i = 0; i < newSelectedItems.length; i++) {
        const item = newSelectedItems[i];
        console.log(
          `${item.label ? item.label : item.name}${i < newSelectedItems.length - 1 ? ", " : ""}`,
        );
      }

      setSelectedItems(newSelectedItems);
    },
    [],
  );

  const handleSearchPatternChange = useCallback((newSearchPattern: string) => {
    console.log(
      `handleSearchPatternChange() called with new search pattern ${newSearchPattern}`,
    );

    setSearchPattern(newSearchPattern);
  }, []);

  const customItemProps: CreateCustomItemProps = {
    buttonLabel: "Create calculated column",
    onClickCreateCustomItem: handleClickCreateCustomItem,
  };

  return (
    <ItemPicker
      allItems={allItems}
      selectedItems={selectedItems}
      searchPattern={searchPattern}
      itemTypeSingular={itemTypeSingular}
      onSelectedItemsChange={handleSelectedItemsChange}
      onSearchPatternChange={handleSearchPatternChange}
      createCustomItemProps={customItemProps}
      style={{ width: 300, height: 800 }}
    />
  );
};

export const EmptyItemPicker = () => {
  return (
    <StatefulParent
      allItems={[]}
      initialSelectedItems={[]}
      itemTypeSingular="pay day"
    />
  );
};

export const DefaultItemPicker = () => {
  const allItems: ItemDescriptor[] = useMemo(
    () => [
      { name: "account" },
      { name: "algo" },
      { name: "averagePrice", label: "Average price" },
      { name: "ccy" },
      { name: "childCount", label: "Child count" },
      { name: "exchange" },
      { name: "filledQty" },
      { name: "id" },
      { name: "idAsInt" },
      { name: "openQty" },
      { name: "price" },
      { name: "quantity" },
      { name: "ric" },
      { name: "side" },
      { name: "status" },
      { name: "volLimit" },
      { name: "vuuCreatedTimestamp" },
      { name: "vuuUpdatedTimestamp" },
    ],
    [],
  );

  const selectedItems = useMemo(() => allItems.slice(0, 10), [allItems]);

  return (
    <StatefulParent
      allItems={allItems}
      initialSelectedItems={selectedItems}
      itemTypeSingular="column"
    />
  );
};

export const ManyItemsItemPicker = () => {
  const schema = getSchema("TwoHundredColumns");

  const allItems: ItemDescriptor[] = useMemo(() => {
    return schema.columns.map((column) => {
      return { name: column.name };
    });
  }, []);

  const selectedItems = useMemo(() => allItems.slice(0, 10), [allItems]);

  return (
    <StatefulParent
      allItems={allItems}
      initialSelectedItems={selectedItems}
      itemTypeSingular="column"
    />
  );
};

export const CalculatedColumnPicker = () => {
  const allItems: ItemDescriptor[] = useMemo(
    () => [
      { name: "item1", label: "Regular column 1" },
      { name: "item2", label: "Regular column 2" },
      { name: "item3", label: "Regular column 3" },
      { name: "item4", label: "Regular column 4" },
      { name: "item5", label: "Calculated column 1", icon: "check-check" },
      { name: "item6", label: "Calculated column 2", icon: "check-check" },
    ],
    [],
  );

  const selectedItems = useMemo(() => allItems.slice(0, 3), [allItems]);

  return (
    <StatefulParent
      allItems={allItems}
      initialSelectedItems={selectedItems}
      itemTypeSingular="column"
    />
  );
};
