import {
  TableRowClickHandlerInternal,
  TableRowSelectHandlerInternal,
  TableSelectionModel,
} from "@vuu-ui/vuu-table-types";
import {
  deselectItem,
  dispatchMouseEvent,
  isRowSelected,
  metadataKeys,
  queryClosest,
  selectItem,
} from "@vuu-ui/vuu-utils";
import { Selection } from "@vuu-ui/vuu-data-types";
import {
  KeyboardEvent,
  KeyboardEventHandler,
  RefObject,
  useCallback,
  useRef,
} from "react";
import { getRowElementByAriaIndex } from "./table-dom-utils";
import { TableProps } from "./Table";

const { IDX } = metadataKeys;

const NO_SELECTION: Selection = [];

const defaultSelectionKeys = ["Enter", " "];

export interface SelectionHookProps
  extends Pick<TableProps, "defaultSelectedIndexValues" | "onSelectionChange"> {
  containerRef: RefObject<HTMLElement | null>;
  highlightedIndexRef: RefObject<number | undefined>;
  selectionKeys?: string[];
  selectionModel: TableSelectionModel;
  onSelect?: TableRowSelectHandlerInternal;
}

export const useSelection = ({
  containerRef,
  defaultSelectedIndexValues = NO_SELECTION,
  highlightedIndexRef,
  selectionKeys = defaultSelectionKeys,
  selectionModel,
  onSelect,
  onSelectionChange,
}: SelectionHookProps) => {
  selectionModel === "extended" || selectionModel === "checkbox";
  const lastActiveRef = useRef(-1);
  const selectedRef = useRef<Selection>(defaultSelectedIndexValues);

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
        const { current: container } = containerRef;
        if (rowIndex !== undefined && rowIndex !== -1 && container) {
          const rowEl = getRowElementByAriaIndex(container, rowIndex);
          if (rowEl) {
            dispatchMouseEvent(rowEl, "click");
          }
        }
      }
    },
    [containerRef, highlightedIndexRef, isSelectionEvent],
  );

  return {
    onKeyDown: handleKeyDown,
    onRowClick: handleRowClick,
  };
};
