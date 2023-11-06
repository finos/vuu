import {
  Selection,
  SelectionChangeHandler,
  TableSelectionModel,
} from "@finos/vuu-datagrid-types";
import {
  deselectItem,
  isRowSelected,
  metadataKeys,
  selectItem,
} from "@finos/vuu-utils";
import { DataSourceRow } from "@finos/vuu-data-types";
import { useCallback, useRef } from "react";
import { RowClickHandler } from "./dataTableTypes";

const { IDX } = metadataKeys;

const NO_SELECTION: Selection = [];

export interface SelectionHookProps {
  selectionModel: TableSelectionModel;
  onSelect?: (row: DataSourceRow) => void;
  onSelectionChange: SelectionChangeHandler;
}

export const useSelection = ({
  selectionModel,
  onSelect,
  onSelectionChange,
}: SelectionHookProps) => {
  selectionModel === "extended" || selectionModel === "checkbox";
  const lastActiveRef = useRef(-1);
  const selectedRef = useRef<Selection>(NO_SELECTION);

  const handleSelectionChange: RowClickHandler = useCallback(
    (row, rangeSelect, keepExistingSelection) => {
      const { [IDX]: idx } = row;
      const { current: active } = lastActiveRef;
      const { current: selected } = selectedRef;

      const selectOperation = isRowSelected(row) ? deselectItem : selectItem;

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

      onSelect?.(row);
      onSelectionChange?.(newSelected);
    },
    [onSelect, onSelectionChange, selectionModel]
  );

  return handleSelectionChange;
};
