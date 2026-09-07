<<<<<<< HEAD
<<<<<<< HEAD
=======
import { MouseEventHandler, useCallback, useMemo, useState } from "react";
>>>>>>> 0d00a9699 (First version of ItemPicker as a controlled component)
=======
>>>>>>> 184c859dd (Updates to address review comments on ItemPicker, additional fix for search logic to search label, else name)
import { getSchema } from "@vuu-ui/vuu-data-test";
import {
  CreateCustomItemProps,
  ItemDescriptor,
  ItemPicker,
} from "@vuu-ui/vuu-ui-controls";
<<<<<<< HEAD
<<<<<<< HEAD
import { ItemTypeName } from "@vuu-ui/vuu-utils";
import { MouseEventHandler, useCallback, useMemo, useState } from "react";
=======
>>>>>>> 0d00a9699 (First version of ItemPicker as a controlled component)
=======
import { ItemTypeName } from "@vuu-ui/vuu-utils";
import { MouseEventHandler, useCallback, useMemo, useState } from "react";
>>>>>>> 184c859dd (Updates to address review comments on ItemPicker, additional fix for search logic to search label, else name)

interface StatefulParentProps {
  allItems: ItemDescriptor[];
  initialSelectedItems: ItemDescriptor[];
<<<<<<< HEAD
<<<<<<< HEAD
  itemTypeName: ItemTypeName;
  createCustomItemProps?: CreateCustomItemProps;
  maxSelections?: number;
=======
  itemTypeSingular: string;
>>>>>>> 0d00a9699 (First version of ItemPicker as a controlled component)
=======
  itemTypeName: ItemTypeName;
  createCustomItemProps?: CreateCustomItemProps;
  maxSelections?: number;
>>>>>>> 184c859dd (Updates to address review comments on ItemPicker, additional fix for search logic to search label, else name)
}

const StatefulParent = ({
  allItems,
  initialSelectedItems,
<<<<<<< HEAD
<<<<<<< HEAD
  itemTypeName,
  createCustomItemProps,
  maxSelections,
}: StatefulParentProps) => {
  const [selectedItems, setSelectedItems] = useState(initialSelectedItems);
<<<<<<< HEAD
=======
  itemTypeSingular,
}: StatefulParentProps) => {
  const [selectedItems, setSelectedItems] = useState(initialSelectedItems);
  const [searchPattern, setSearchPattern] = useState("");

  const handleClickCreateCustomItem = useCallback<
    MouseEventHandler<HTMLButtonElement>
  >((e) => {
    console.log("handleClickCreateCustomItem() called");
  }, []);
>>>>>>> 0d00a9699 (First version of ItemPicker as a controlled component)
=======
  itemTypeName,
  createCustomItemProps,
  maxSelections,
}: StatefulParentProps) => {
  const [selectedItems, setSelectedItems] = useState(initialSelectedItems);
>>>>>>> 184c859dd (Updates to address review comments on ItemPicker, additional fix for search logic to search label, else name)
=======
  const [selectedItemsFiltered, setSelectedItemsFiltered] = useState([
    ...initialSelectedItems,
  ]);
>>>>>>> 715d6233d (Update of ColumnPicker and ItemPicker showcase examples)

  const handleSelectedItemsChange = useCallback(
    (newSelectedItems: readonly ItemDescriptor[]) => {
      console.log(
        "handleSelectedItemsChange() called with new item selections: ",
      );
      logItemsToConsole(newSelectedItems);
      setSelectedItems([...newSelectedItems]);
    },
    [],
  );

<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
=======
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

>>>>>>> 0d00a9699 (First version of ItemPicker as a controlled component)
=======
>>>>>>> 184c859dd (Updates to address review comments on ItemPicker, additional fix for search logic to search label, else name)
=======
  const handleSelectedItemsFilteredChange = useCallback(
    (newSelectedItemsFiltered: readonly ItemDescriptor[]) => {
      console.log(
        "handleSelectedItemsFilteredChange() called with new filtered item selections: ",
      );
      logItemsToConsole(newSelectedItemsFiltered);
      setSelectedItemsFiltered([...newSelectedItemsFiltered]);
    },
    [],
  );

  function logItemsToConsole(
    selectedItemsToLog: readonly ItemDescriptor[],
  ): void {
    for (let i = 0; i < selectedItemsToLog.length; i++) {
      const item = selectedItemsToLog[i];
      console.log(
        `${item.label ? item.label : item.name}${i < selectedItemsToLog.length - 1 ? ", " : " "}`,
      );
    }
    console.log(`(${selectedItemsToLog.length} items)`);
  }

>>>>>>> 715d6233d (Update of ColumnPicker and ItemPicker showcase examples)
  return (
    <ItemPicker
      allItems={allItems}
      selectedItems={selectedItems}
<<<<<<< HEAD
<<<<<<< HEAD
      itemTypeName={itemTypeName}
      onSelectedItemsChange={handleSelectedItemsChange}
      onSelectedItemsFilteredChange={handleSelectedItemsFilteredChange}
      createCustomItemProps={createCustomItemProps}
      maxSelections={maxSelections}
=======
      searchPattern={searchPattern}
      itemTypeSingular={itemTypeSingular}
      onSelectedItemsChange={handleSelectedItemsChange}
      onSearchPatternChange={handleSearchPatternChange}
      createCustomItemProps={customItemProps}
>>>>>>> 0d00a9699 (First version of ItemPicker as a controlled component)
=======
      itemTypeName={itemTypeName}
      onSelectedItemsChange={handleSelectedItemsChange}
      createCustomItemProps={createCustomItemProps}
      maxSelections={maxSelections}
>>>>>>> 184c859dd (Updates to address review comments on ItemPicker, additional fix for search logic to search label, else name)
      style={{ width: 300, height: 800 }}
    />
  );
};

export const EmptyItemPicker = () => {
  return (
    <StatefulParent
      allItems={[]}
      initialSelectedItems={[]}
<<<<<<< HEAD
<<<<<<< HEAD
      itemTypeName="pay day"
=======
      itemTypeSingular="pay day"
>>>>>>> 0d00a9699 (First version of ItemPicker as a controlled component)
=======
      itemTypeName="pay day"
>>>>>>> 184c859dd (Updates to address review comments on ItemPicker, additional fix for search logic to search label, else name)
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
<<<<<<< HEAD
<<<<<<< HEAD
      itemTypeName="column"
=======
      itemTypeSingular="column"
>>>>>>> 0d00a9699 (First version of ItemPicker as a controlled component)
=======
      itemTypeName="column"
>>>>>>> 184c859dd (Updates to address review comments on ItemPicker, additional fix for search logic to search label, else name)
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
<<<<<<< HEAD
<<<<<<< HEAD
      itemTypeName="column"
=======
      itemTypeSingular="column"
>>>>>>> 0d00a9699 (First version of ItemPicker as a controlled component)
=======
      itemTypeName="column"
>>>>>>> 184c859dd (Updates to address review comments on ItemPicker, additional fix for search logic to search label, else name)
    />
  );
};

export const CalculatedColumnPicker = () => {
  const allItems: ItemDescriptor[] = useMemo(
    () => [
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 184c859dd (Updates to address review comments on ItemPicker, additional fix for search logic to search label, else name)
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
<<<<<<< HEAD
=======
      { name: "item1", label: "Regular column 1" },
      { name: "item2", label: "Regular column 2" },
      { name: "item3", label: "Regular column 3" },
      { name: "item4", label: "Regular column 4" },
      { name: "item5", label: "Calculated column 1", icon: "check-check" },
      { name: "item6", label: "Calculated column 2", icon: "check-check" },
>>>>>>> 0d00a9699 (First version of ItemPicker as a controlled component)
=======
>>>>>>> 184c859dd (Updates to address review comments on ItemPicker, additional fix for search logic to search label, else name)
    ],
    [],
  );

  const selectedItems = useMemo(() => allItems.slice(0, 3), [allItems]);

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 184c859dd (Updates to address review comments on ItemPicker, additional fix for search logic to search label, else name)
  const handleClickCreateCustomItem = useCallback<
    MouseEventHandler<HTMLButtonElement>
  >(() => {
    console.log("handleClickCreateCustomItem() called");
  }, []);

  const customItemProps: CreateCustomItemProps = {
    buttonLabel: "Create calculated column",
    onClickCreateCustomItem: handleClickCreateCustomItem,
  };

<<<<<<< HEAD
=======
>>>>>>> 0d00a9699 (First version of ItemPicker as a controlled component)
=======
>>>>>>> 184c859dd (Updates to address review comments on ItemPicker, additional fix for search logic to search label, else name)
  return (
    <StatefulParent
      allItems={allItems}
      initialSelectedItems={selectedItems}
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 184c859dd (Updates to address review comments on ItemPicker, additional fix for search logic to search label, else name)
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
<<<<<<< HEAD
=======
      itemTypeSingular="column"
>>>>>>> 0d00a9699 (First version of ItemPicker as a controlled component)
=======
>>>>>>> 184c859dd (Updates to address review comments on ItemPicker, additional fix for search logic to search label, else name)
    />
  );
};
