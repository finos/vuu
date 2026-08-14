import { getSchema } from "@vuu-ui/vuu-data-test";
import {
  CreateCustomItemProps,
  ItemDescriptor,
  ItemPicker,
} from "@vuu-ui/vuu-ui-controls";
import { ItemTypeName } from "@vuu-ui/vuu-utils";
import { MouseEventHandler, useCallback, useMemo, useState } from "react";

interface StatefulParentProps {
  allItems: ItemDescriptor[];
  initialSelectedItems: ItemDescriptor[];
  itemTypeName: ItemTypeName;
  createCustomItemProps?: CreateCustomItemProps;
  maxSelections?: number;
}

const StatefulParent = ({
  allItems,
  initialSelectedItems,
  itemTypeName,
  createCustomItemProps,
  maxSelections,
}: StatefulParentProps) => {
  const [selectedItems, setSelectedItems] = useState(initialSelectedItems);

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

  return (
    <ItemPicker
      allItems={allItems}
      selectedItems={selectedItems}
      itemTypeName={itemTypeName}
      onSelectedItemsChange={handleSelectedItemsChange}
      createCustomItemProps={createCustomItemProps}
      maxSelections={maxSelections}
      style={{ width: 300, height: 800 }}
    />
  );
};

export const EmptyItemPicker = () => {
  return (
    <StatefulParent
      allItems={[]}
      initialSelectedItems={[]}
      itemTypeName="pay day"
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
      itemTypeName="column"
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
      itemTypeName="column"
    />
  );
};

export const CalculatedColumnPicker = () => {
  const allItems: ItemDescriptor[] = useMemo(
    () => [
      { name: "regularcolumn1", label: "Regular column 1" },
      { name: "regularcolumn2", label: "Regular column 2" },
      { name: "regularcolumn3", label: "Regular column 3" },
      { name: "regularcolumn4", label: "Regular column 4" },
      {
        name: "calculatedcolumn1",
        label: "Calculated column 1",
        icon: "check-check",
      },
      {
        name: "calculatedcolumn2",
        label: "Calculated column 2",
        icon: "check-check",
      },
    ],
    [],
  );

  const selectedItems = useMemo(() => allItems.slice(0, 3), [allItems]);

  const handleClickCreateCustomItem = useCallback<
    MouseEventHandler<HTMLButtonElement>
  >(() => {
    console.log("handleClickCreateCustomItem() called");
  }, []);

  const customItemProps: CreateCustomItemProps = {
    buttonLabel: "Create calculated column",
    onClickCreateCustomItem: handleClickCreateCustomItem,
  };

  return (
    <StatefulParent
      allItems={allItems}
      initialSelectedItems={selectedItems}
      itemTypeName="column"
      createCustomItemProps={customItemProps}
    />
  );
};

export const SpecialItemsWithMaxSelection = () => {
  const allItems: ItemDescriptor[] = useMemo(
    () => [
      { name: "caviar", label: "Caviar" },
      { name: "quailEgg", label: "Quail egg" },
      { name: "truffle", label: "Truffle" },
      { name: "foisGras", label: "Fois gras" },
      { name: "haggis", label: "Haggis" },
      { name: "kobeBeef", label: "Kobe beef" },
    ],
    [],
  );

  const selectedItems = useMemo(() => allItems.slice(0, 1), [allItems]);

  const itemTypeName: ItemTypeName = {
    singular: "delicacy",
    plural: "delicacies",
  };

  return (
    <StatefulParent
      allItems={allItems}
      initialSelectedItems={selectedItems}
      itemTypeName={itemTypeName}
      maxSelections={2}
    />
  );
};

export const MisconfiguredMaxSelection = () => {
  const allItems: ItemDescriptor[] = useMemo(
    () => [
      { name: "regularcolumn1", label: "Regular column 1" },
      { name: "regularcolumn2", label: "Regular column 2" },
      { name: "regularcolumn3", label: "Regular column 3" },
      { name: "regularcolumn4", label: "Regular column 4" },
    ],
    [],
  );

  const selectedItems = useMemo(() => allItems, [allItems]);

  return (
    <StatefulParent
      allItems={allItems}
      initialSelectedItems={selectedItems}
      itemTypeName={"column"}
      maxSelections={2}
    />
  );
};
