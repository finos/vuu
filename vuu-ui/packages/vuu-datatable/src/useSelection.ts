import {
  Selection,
  SelectionChangeHandler,
  TableSelectionModel,
} from "@finos/vuu-datagrid-types";
import { deselectItem, metadataKeys, selectItem } from "@finos/vuu-utils";
import { useCallback, useRef } from "react";
import { RowClickHandler } from "./dataTableTypes";

const { IDX, SELECTED } = metadataKeys;

const NO_SELECTION: Selection = [];

export interface SelectionHookProps {
  selectionModel: TableSelectionModel;
  onSelectionChange: SelectionChangeHandler;
}

export const useSelection = ({
  selectionModel,
  onSelectionChange,
}: SelectionHookProps) => {
  selectionModel === "extended" || selectionModel === "checkbox";
  const lastActiveRef = useRef(-1);
  const selectedRef = useRef<Selection>(NO_SELECTION);

  const handleSelectionChange: RowClickHandler = useCallback(
    (row, rangeSelect, keepExistingSelection) => {
      const { [IDX]: idx, [SELECTED]: isSelected } = row;
      const { current: active } = lastActiveRef;
      const { current: selected } = selectedRef;

      const selectOperation = isSelected ? deselectItem : selectItem;

      const newSelected = selectOperation(
        selectionModel,
        selected,
        idx,
        rangeSelect,
        keepExistingSelection,
        active
      );

      selectedRef.current = newSelected;
      lastActiveRef.current = idx;

      if (onSelectionChange) {
        onSelectionChange(newSelected);
      }
    },
    [onSelectionChange, selectionModel]
  );

  return handleSelectionChange;
};
