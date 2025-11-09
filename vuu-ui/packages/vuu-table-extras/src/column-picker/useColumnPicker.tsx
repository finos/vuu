import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { queryClosest } from "@vuu-ui/vuu-utils";
import {
  FormEventHandler,
  MouseEventHandler,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ColumnChangeSource,
  ColumnModel,
  SelectedColumnChangeType,
} from "./ColumnModel";

export type ColumnPickerAction = (column: ColumnDescriptor) => void;

const SOURCE = ColumnChangeSource.ColumnPicker;

const columnName = (target: EventTarget) => {
  const listItem = queryClosest(target, ".saltOption", true);
  const { name } = listItem.dataset;
  if (name) {
    return name;
  } else {
    throw Error(
      "[useColumnPicker] column name could not be identified, data-name attribute not found",
    );
  }
};
export type SelectedColumnsChangeHandler = (
  columns: ColumnDescriptor[],
  changeType: SelectedColumnChangeType,
) => void;

export interface ColumPickerHookProps {
  columnModel: ColumnModel;
}

export const useColumnPicker = ({
  columnModel: model,
}: ColumPickerHookProps) => {
  const [, forceRender] = useState({});
  useEffect(() => {
    model.on("render", forceRender);
    return () => {
      model.removeListener("render", forceRender);
    };
  }, [model]);

  const handleChangeSearchInput = useCallback<FormEventHandler>(
    (evt) => {
      const { value } = evt.target as HTMLInputElement;
      model.searchPattern = value;
    },
    [model],
  );

  const handleAddItemToSelectedList = useCallback<
    MouseEventHandler<HTMLButtonElement>
  >(
    (e) => model.addItemToSelectedColumns(columnName(e.target), SOURCE),
    [model],
  );

  const handleRemoveItemFromSelectedList = useCallback<
    MouseEventHandler<HTMLButtonElement>
  >(
    (e) => model.removeItemFromSelectedColumns(columnName(e.target), SOURCE),
    [model],
  );

  return {
    availableColumns: model.availableColumns,
    onAddItemToSelectedList: handleAddItemToSelectedList,
    onRemoveItemFromSelectedList: handleRemoveItemFromSelectedList,
    onChangeSearchInput: handleChangeSearchInput,
    searchText: model.searchPattern,
    selectedColumns: model.selectedColumns,
  };
};
