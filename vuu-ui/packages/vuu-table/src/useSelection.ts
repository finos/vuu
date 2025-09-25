import {
  TableRowClickHandlerInternal,
  TableRowSelectHandlerInternal,
  SelectionChangeHandler,
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

const { IDX, KEY, SELECTED } = metadataKeys;

const orderedRowKeys = (
  activeRowIdentifier: RowIdentifier | undefined,
  newRowIdentifier: RowIdentifier,
  rangeSelect = false,
): [string, string] | [string] => {
  if (rangeSelect && activeRowIdentifier) {
    if (newRowIdentifier.rowIdx > activeRowIdentifier.rowIdx) {
      return [activeRowIdentifier.rowKey, newRowIdentifier.rowKey];
    } else {
      return [newRowIdentifier.rowKey, activeRowIdentifier.rowKey];
    }
  } else {
    return [newRowIdentifier.rowKey];
  }
};

const defaultSelectionKeys = ["Enter", " "];

type RowIdentifier = {
  rowIdx: number;
  rowKey: string;
};

export interface SelectionHookProps
  extends Pick<TableProps, "onSelectionChange"> {
  containerRef: RefObject<HTMLElement | null>;
  highlightedIndexRef: RefObject<number | undefined>;
  selectionKeys?: string[];
  selectionModel: TableSelectionModel;
  onSelectionChange: SelectionChangeHandler;
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
  const lastActiveRef = useRef<RowIdentifier | undefined>(undefined);

  const isSelectionEvent = useCallback(
    (evt: KeyboardEvent<HTMLElement>) => selectionKeys.includes(evt.key),
    [selectionKeys],
  );

  const handleRowClick = useCallback<TableRowClickHandlerInternal>(
    (e, row, rangeSelect, keepExistingSelection) => {
      const { [IDX]: rowIdx, [KEY]: rowKey } = row;
      const { current: activeRowKey } = lastActiveRef;
      const newRowIdentifier = { rowIdx, rowKey } as RowIdentifier;

      const selectOperation = row[SELECTED] ? deselectItem : selectItem;

      if (selectionModel === "checkbox") {
        const cell = queryClosest(e.target, ".vuuTableCell");
        if (!cell?.querySelector(".vuuCheckboxRowSelector")) {
          return;
        }
      }

      const [fromRowKey, toRowKey] = orderedRowKeys(
        activeRowKey,
        newRowIdentifier,
        rangeSelect,
      );

      const selectRequest = selectOperation(
        selectionModel,
        fromRowKey,
        rangeSelect,
        keepExistingSelection,
        toRowKey,
      );

      lastActiveRef.current = newRowIdentifier;

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
