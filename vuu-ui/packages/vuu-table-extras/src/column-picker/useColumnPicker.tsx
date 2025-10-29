import { useControlled } from "@salt-ds/core";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { queryClosest, ValueOf } from "@vuu-ui/vuu-utils";
import {
  FormEventHandler,
  MouseEventHandler,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

export type ColumnPickerAction = (column: ColumnDescriptor) => void;

const nonSelectedColumns = ({
  availableColumns,
  selectedColumns,
}: {
  availableColumns: ColumnDescriptor[];
  selectedColumns: ColumnDescriptor[];
}) =>
  availableColumns.filter(
    ({ name }) => selectedColumns.findIndex((c) => c.name === name) === -1,
  );

const findColumn = (target: EventTarget, columns: ColumnDescriptor[]) => {
  const listItem = queryClosest(target, ".saltOption", true);
  const { name } = listItem.dataset;
  const column = columns.find((col) => col.name === name);
  if (column) {
    return column;
  } else {
    throw Error(`[useColumnPicker] column ${name} not found`);
  }
};
export const SelectedColumnChangeType = {
  ColumnAdded: "column-added",
  ColumnRemoved: "column-removed",
  ColumnsReordered: "columns-reordered",
} as const;
export type SelectedColumnChangeType = ValueOf<typeof SelectedColumnChangeType>;
export type SelectedColumnsChangeHandler = (
  columns: ColumnDescriptor[],
  changeType: SelectedColumnChangeType,
) => void;

export interface ColumPickerHookProps {
  /**
   * All available columns, including selected columns.
   */
  availableColumns: ColumnDescriptor[];
  /**
   * Columns already selected and rendered in Table,
   * columnPicker will be uncontrolled
   */
  defaultSelectedColumns?: ColumnDescriptor[];
  onChangeSelectedColumns: SelectedColumnsChangeHandler;
  /**
   * Columns already selected and rendered in Table.
   * columnPicker will be controlled
   */
  selectedColumns?: ColumnDescriptor[];
}

export const useColumnPicker = ({
  availableColumns,
  defaultSelectedColumns,
  onChangeSelectedColumns,
  selectedColumns: selectedColumnsProp,
}: ColumPickerHookProps) => {
  const [searchState, setSearchState] = useState<{
    searchText: string;
  }>({ searchText: "" });

  const [selectedColumns, setSelectedColumns] = useControlled({
    controlled: selectedColumnsProp,
    default: defaultSelectedColumns ?? [],
    name: "ColumnPicker",
    state: "selectedColumns",
  });

  const visibleColumnsRef = useRef({ availableColumns, selectedColumns });

  useMemo(() => {
    const value = searchState.searchText.toLowerCase();
    if (value) {
      const pattern = value.toLowerCase();
      visibleColumnsRef.current = {
        availableColumns: availableColumns.filter(
          ({ name, label = name }) =>
            label.toLowerCase().indexOf(pattern) !== -1,
        ),
        selectedColumns: selectedColumns.filter(
          ({ name, label = name }) =>
            label.toLowerCase().indexOf(pattern) !== -1,
        ),
      };
    } else {
      visibleColumnsRef.current = { availableColumns, selectedColumns };
    }
  }, [availableColumns, selectedColumns, searchState.searchText]);

  const handleChangeSearchInput = useCallback<FormEventHandler>((evt) => {
    const { value } = evt.target as HTMLInputElement;
    setSearchState({
      searchText: value,
    });
  }, []);

  const handleAddItemToSelectedList = useCallback<
    MouseEventHandler<HTMLButtonElement>
  >(
    ({ target }) => {
      const targetColumn = findColumn(target, availableColumns);
      const newColumns = selectedColumns.concat(targetColumn);
      onChangeSelectedColumns(newColumns, SelectedColumnChangeType.ColumnAdded);
      setSelectedColumns(newColumns);
    },
    [
      availableColumns,
      onChangeSelectedColumns,
      selectedColumns,
      setSelectedColumns,
    ],
  );

  const handleRemoveItemFromSelectedList = useCallback<
    MouseEventHandler<HTMLButtonElement>
  >(
    ({ target }) => {
      const targetColumn = findColumn(target, selectedColumns);
      const newColumns = selectedColumns.filter(
        (col) => col.name !== targetColumn.name,
      );
      onChangeSelectedColumns(
        newColumns,
        SelectedColumnChangeType.ColumnRemoved,
      );
      setSelectedColumns(newColumns);
    },
    [onChangeSelectedColumns, selectedColumns, setSelectedColumns],
  );

  return {
    availableColumns: nonSelectedColumns(visibleColumnsRef.current),
    onAddItemToSelectedList: handleAddItemToSelectedList,
    onRemoveItemFromSelectedList: handleRemoveItemFromSelectedList,
    onChangeSearchInput: handleChangeSearchInput,
    searchState,
    selectedColumns: visibleColumnsRef.current.selectedColumns,
  };
};
