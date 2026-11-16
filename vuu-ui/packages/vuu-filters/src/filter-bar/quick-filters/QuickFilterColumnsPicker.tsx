import { Button } from "@salt-ds/core";
import { type ItemDescriptor, ItemPicker } from "@vuu-ui/vuu-ui-controls";
import cx from "clsx";
import { useCallback, useState } from "react";

const classBase = "vuuQuickFilters";

export interface QuickFilterColumnsPickerProps {
  allItems: ItemDescriptor[];
  className?: string;
  onChangeColumns: (columns: string[]) => void;
  onResetColumns: () => void;
  selectedItems: ItemDescriptor[];
}

/**
 * Picks which columns have quick filters, and their order, with a Reset to
 * default action.
 */
export const QuickFilterColumnsPicker = ({
  allItems,
  className,
  onChangeColumns,
  onResetColumns,
  selectedItems,
}: QuickFilterColumnsPickerProps) => {
  const handleSelectedItemsChange = useCallback(
    (items: readonly ItemDescriptor[]) =>
      onChangeColumns(items.map(({ name }) => name)),
    [onChangeColumns],
  );
  return (
    <div className={cx(`${classBase}-columnsPicker`, className)}>
      <ItemPicker
        allItems={allItems}
        itemTypeName="column"
        onSelectedItemsChange={handleSelectedItemsChange}
        selectedItems={selectedItems}
      />
      <div className={`${classBase}-columnsFooter`}>
        <Button
          appearance="transparent"
          onClick={onResetColumns}
          sentiment="accented"
        >
          Reset to default
        </Button>
      </div>
    </div>
  );
};

export interface ContextPanelColumnsPickerProps
  extends Omit<
    QuickFilterColumnsPickerProps,
    "onResetColumns" | "selectedItems"
  > {
  /**
   * The quick filter columns when the panel opens. The picker then keeps
   * its own selection, as context panel content is not re-rendered by
   * QuickFilters.
   */
  defaultSelectedItems: ItemDescriptor[];
  /**
   * The columns Reset to default restores.
   */
  resetColumns: string[];
}

/**
 * The column picker for a context panel, which holds its own selection.
 */
export const ContextPanelColumnsPicker = ({
  allItems,
  defaultSelectedItems,
  onChangeColumns,
  resetColumns,
  ...props
}: ContextPanelColumnsPickerProps) => {
  const [selectedItems, setSelectedItems] = useState(defaultSelectedItems);

  const handleChangeColumns = useCallback(
    (columns: string[]) => {
      setSelectedItems(
        columns
          .map((name) => allItems.find((item) => item.name === name))
          .filter((item): item is ItemDescriptor => item !== undefined),
      );
      onChangeColumns(columns);
    },
    [allItems, onChangeColumns],
  );

  const handleResetColumns = useCallback(
    () => handleChangeColumns(resetColumns),
    [handleChangeColumns, resetColumns],
  );

  return (
    <QuickFilterColumnsPicker
      {...props}
      allItems={allItems}
      onChangeColumns={handleChangeColumns}
      onResetColumns={handleResetColumns}
      selectedItems={selectedItems}
    />
  );
};
