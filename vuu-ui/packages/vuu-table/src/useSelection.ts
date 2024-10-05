import {
  TableRowClickHandlerInternal,
  TableRowSelectHandlerInternal,
  TableSelectionModel,
} from "@finos/vuu-table-types";
import {
  deselectItem,
  dispatchMouseEvent,
  getRowElementAtIndex,
  isRowSelected,
  metadataKeys,
  queryClosest,
  selectItem,
} from "@finos/vuu-utils";
import { Selection, SelectionChangeHandler } from "@finos/vuu-data-types";
import {
  KeyboardEvent,
  KeyboardEventHandler,
  MutableRefObject,
  useCallback,
  useRef,
} from "react";

const { IDX } = metadataKeys;

const NO_SELECTION: Selection = [];

const defaultSelectionKeys = ["Enter", " "];

export interface SelectionHookProps {
  highlightedIndexRef: MutableRefObject<number | undefined>;
  selectionKeys?: string[];
  selectionModel: TableSelectionModel;
  onSelect?: TableRowSelectHandlerInternal;
  onSelectionChange: SelectionChangeHandler;
}

export const useSelection = ({
  highlightedIndexRef,
  selectionKeys = defaultSelectionKeys,
  selectionModel,
  onSelect,
  onSelectionChange,
}: SelectionHookProps) => {
  selectionModel === "extended" || selectionModel === "checkbox";
  const lastActiveRef = useRef(-1);
  const selectedRef = useRef<Selection>(NO_SELECTION);

  const isSelectionEvent = useCallback(
    (evt: KeyboardEvent<HTMLElement>) => selectionKeys.includes(evt.key),
    [selectionKeys],
  );

  const handleRowClick = useCallback<TableRowClickHandlerInternal>(
    (e, row, rangeSelect, keepExistingSelection) => {
      const { [IDX]: idx } = row;
      const { current: active } = lastActiveRef;
      const { current: selected } = selectedRef;

      const selectOperation = isRowSelected(row) ? deselectItem : selectItem;

      if (selectionModel === "checkbox") {
        const cell = queryClosest(e.target, ".vuuTableCell");
        if (!cell?.querySelector(".vuuCheckboxRowSelector")) {
          return;
        }
      }

      const newSelected = selectOperation(
        selectionModel,
        selected,
        idx,
        rangeSelect,
        keepExistingSelection,
        active,
      );

      selectedRef.current = newSelected;
      lastActiveRef.current = idx;

      onSelect?.(selectOperation === selectItem ? row : null);
      onSelectionChange?.(newSelected);
    },
    [onSelect, onSelectionChange, selectionModel],
  );

  const handleKeyDown = useCallback<KeyboardEventHandler<HTMLElement>>(
    (e) => {
      if (isSelectionEvent(e)) {
        const { current: rowIndex } = highlightedIndexRef;
        if (rowIndex !== undefined && rowIndex !== -1) {
          const rowEl = getRowElementAtIndex(e.target, rowIndex);
          // const rowEl = (e.target as HTMLElement).querySelector(
          //   `[aria-rowindex="${rowIndex + 1}"]`
          // ) as HTMLElement;
          if (rowEl) {
            dispatchMouseEvent(rowEl, "click");
          }
        }
      }
    },
    [highlightedIndexRef, isSelectionEvent],
  );

  return {
    onKeyDown: handleKeyDown,
    onRowClick: handleRowClick,
  };
};
