import {
  TableRowClickHandlerInternal,
  TableRowSelectHandlerInternal,
  TableRowSelectionChangeHandlerInternal,
  TableSelectionModel,
} from "@vuu-ui/vuu-table-types";
import {
  deselectItem,
  dispatchMouseEvent,
  metadataKeys,
  queryClosest,
  selectItem,
} from "@vuu-ui/vuu-utils";
import {
  KeyboardEvent,
  KeyboardEventHandler,
  RefObject,
  useCallback,
  useRef,
} from "react";
import { getRowElementByAriaIndex } from "./table-dom-utils";
import { TableProps } from "./Table";

const { KEY, SELECTED } = metadataKeys;

const defaultSelectionKeys = ["Enter", " "];

export interface SelectionHookProps
  extends Pick<TableProps, "defaultSelectedIndexValues" | "onSelectionChange"> {
  containerRef: RefObject<HTMLElement | null>;
  highlightedIndexRef: RefObject<number | undefined>;
  selectionKeys?: string[];
  selectionModel: TableSelectionModel;
  onSelectionChange: TableRowSelectionChangeHandlerInternal;
  onSelect?: TableRowSelectHandlerInternal;
}

export const useSelection = ({
  containerRef,
  highlightedIndexRef,
  selectionKeys = defaultSelectionKeys,
  selectionModel,
  onSelect,
  onSelectionChange,
}: SelectionHookProps) => {
  selectionModel === "extended" || selectionModel === "checkbox";
  const lastActiveRef = useRef<string | undefined>(undefined);

  const isSelectionEvent = useCallback(
    (evt: KeyboardEvent<HTMLElement>) => selectionKeys.includes(evt.key),
    [selectionKeys],
  );

  const handleRowClick = useCallback<TableRowClickHandlerInternal>(
    (e, row, rangeSelect, keepExistingSelection) => {
      const { [KEY]: rowKey } = row;
      const { current: activeRowKey } = lastActiveRef;

      const selectOperation = row[SELECTED] ? deselectItem : selectItem;

      if (selectionModel === "checkbox") {
        const cell = queryClosest(e.target, ".vuuTableCell");
        if (!cell?.querySelector(".vuuCheckboxRowSelector")) {
          return;
        }
      }

      const rangeRowKey = rangeSelect ? activeRowKey : undefined;

      const selectRequest = selectOperation(
        selectionModel,
        rowKey,
        rangeSelect,
        keepExistingSelection,
        rangeRowKey,
      );

      lastActiveRef.current = rowKey;

      if (selectRequest) {
        onSelect?.(selectOperation === selectItem ? row : null);
        onSelectionChange?.(selectRequest);
      }
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
