import { ColumnDescriptor, TableSelectionModel } from "@vuu-ui/vuu-table-types";
import { ItemDescriptor } from "@vuu-ui/vuu-ui-controls";
import { isCalculatedColumn } from "@vuu-ui/vuu-utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnChangeSource, ColumnModel } from "./ColumnModel";

export type ColumnSelectionModel = Extract<
  TableSelectionModel,
  "none" | "single"
>;

const SOURCE = ColumnChangeSource.ColumnPicker;

export interface ColumnPickerHookProps {
  columnModel: ColumnModel;
}

export const useColumnPicker = ({
  columnModel: model,
}: ColumnPickerHookProps) => {
  const [, forceRender] = useState({});
  useEffect(() => {
    model.on("render", forceRender);
    return () => {
      model.removeListener("render", forceRender);
    };
  }, [model]);

  const allItems = useMemo(() => {
    const itemDescriptors: ItemDescriptor[] = model.allColumns.map(
      (column: ColumnDescriptor) => {
        return {
          name: column.name,
          label: column.label,
          icon: isCalculatedColumn(column.name)
            ? "vuuCalculatedColumnIcon"
            : undefined,
        };
      },
    );
    return itemDescriptors;
  }, [model.allColumns]);

  const selectedItems = useMemo(() => {
    const itemDescriptors: ItemDescriptor[] = model.selectedColumns.map(
      (column: ColumnDescriptor) => {
        return allItems.find((item) => item.name === column.name)!;
      },
    );
    return itemDescriptors;
  }, [model.selectedColumns, allItems]);

  const oneOrMoreColumnsIsCalculated = useMemo(() => {
    return model.selectedColumnsFiltered.some((column) =>
      isCalculatedColumn(column.name),
    );
  }, [model.selectedColumnsFiltered]);

  const handleSelectedItemsChange = useCallback(
    (newSelectedItems: readonly ItemDescriptor[]) => {
      const newSelectedColumns: ColumnDescriptor[] = newSelectedItems.map(
        (item: ItemDescriptor) => {
          return model.allColumns.find((column) => column.name === item.name)!;
        },
      );

      model.addRemoveOrReorderSelectedColumns(newSelectedColumns, SOURCE);
    },
    [model.allColumns],
  );

  const handleSelectedItemsFilteredChange = useCallback(
    (newSelectedItemsFiltered: readonly ItemDescriptor[]) => {
      const newSelectedColumnsFiltered: ColumnDescriptor[] =
        newSelectedItemsFiltered.map((item: ItemDescriptor) => {
          return model.allColumns.find((column) => column.name === item.name)!;
        });

      model.updateSelectedColumnsFiltered(newSelectedColumnsFiltered);
    },
    [model.allColumns],
  );

  return {
    allItems,
    selectedItems,
    oneOrMoreColumnsIsCalculated,
    handleSelectedItemsChange,
    handleSelectedItemsFilteredChange,
  };
};
