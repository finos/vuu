import { VuuRange } from "@finos/vuu-protocol-types";
import { PageKey, queryClosest } from "@finos/vuu-utils";
import { useControlled } from "@salt-ds/core";
import {
  KeyboardEvent,
  MouseEvent,
  MutableRefObject,
  RefObject,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { TableNavigationStyle } from "./Table";
import {
  NavigationKey,
  cellDropdownShowing,
  closestRowIndex,
  getAriaCellPos,
  getFocusedCell,
  getNextCellPos,
  getTreeNodeOperation,
  getLevelUp as getLevelUp,
} from "./table-dom-utils";
import { ScrollRequestHandler } from "./useTableScroll";
import { FocusCell } from "./useCellFocus";
import { CellFocusState, CellPos } from "@finos/vuu-table-types";

const rowNavigationKeys = new Set<NavigationKey>([
  "Home",
  "End",
  "PageUp",
  "PageDown",
  "ArrowDown",
  "ArrowUp",
]);

const cellNavigationKeys = new Set(rowNavigationKeys);
cellNavigationKeys.add("ArrowLeft");
cellNavigationKeys.add("ArrowRight");

export const isNavigationKey = (
  key: string,
  navigationStyle: TableNavigationStyle,
): key is NavigationKey => {
  switch (navigationStyle) {
    case "cell":
    case "tree":
      return cellNavigationKeys.has(key as NavigationKey);
    case "row":
      return rowNavigationKeys.has(key as NavigationKey);
    default:
      return false;
  }
};

const focusColumnMenuIfAppropriate = (
  e: KeyboardEvent,
  el: HTMLElement | null,
) => {
  if (e.shiftKey && e.key.match(/Arrow(Left|Right)/)) {
    if (el?.classList.contains("vuuTableHeaderCell")) {
      const menuButton = el?.querySelector<HTMLButtonElement>(".vuuColumnMenu");
      if (menuButton) {
        menuButton.focus();
        return true;
      }
    }
  }
  return false;
};

const PageKeys = ["Home", "End", "PageUp", "PageDown"];
export const isPagingKey = (key: string): key is PageKey =>
  PageKeys.includes(key);

export type GroupToggleHandler = (
  treeNodeOperation: "expand" | "collapse",
  rowIndex: number,
) => void;

export interface NavigationHookProps {
  cellFocusStateRef: MutableRefObject<CellFocusState>;
  containerRef: RefObject<HTMLElement>;
  columnCount?: number;
  headerCount: number;
  defaultHighlightedIndex?: number;
  disableFocus?: boolean;
  disableHighlightOnFocus?: boolean;
  focusCell: FocusCell;
  highlightedIndex?: number;
  label?: string;
  navigationStyle: TableNavigationStyle;
  viewportRange: VuuRange;
  onHighlight?: (idx: number) => void;
  onToggleGroup: GroupToggleHandler;
  requestScroll?: ScrollRequestHandler;
  restoreLastFocus?: boolean;
  rowCount?: number;
  selected?: unknown;
  viewportRowCount: number;
}

export const useKeyboardNavigation = ({
  cellFocusStateRef,
  columnCount = 0,
  containerRef,
  defaultHighlightedIndex,
  disableHighlightOnFocus,
  focusCell,
  headerCount,
  highlightedIndex: highlightedIndexProp,
  navigationStyle,
  requestScroll,
  onHighlight,
  onToggleGroup,
  rowCount = 0,
  viewportRowCount,
}: NavigationHookProps) => {
  // Keep this in sync with state value. This can be used by functions that need
  // to reference highlightedIndex at call time but do not need to be regenerated
  // every time it changes (i.e keep highlightedIndex out of their dependency
  // arrays, as it can update frequently)
  const highlightedIndexRef = useRef<number | undefined>();

  const [highlightedIndex, setHighlightedIdx] = useControlled({
    controlled: highlightedIndexProp,
    default: defaultHighlightedIndex,
    name: "UseKeyboardNavigation",
  });
  highlightedIndexRef.current = highlightedIndex;

  // We use aria row index for tracking rows
  const maxRowIndex = rowCount + headerCount;

  const setHighlightedIndex = useCallback(
    (idx: number) => {
      onHighlight?.(idx);
      setHighlightedIdx(idx);
      console.log(`set highlightedIndexRef to ${idx}`);
      highlightedIndexRef.current = idx;
    },
    [onHighlight, setHighlightedIdx],
  );

  const setActiveCell = useCallback(
    (rowIdx: number, colIdx: number, fromKeyboard = false) => {
      const pos: CellPos = [rowIdx, colIdx];
      if (navigationStyle === "row") {
        setHighlightedIdx(rowIdx);
      } else {
        focusCell(pos, fromKeyboard);
      }
    },
    [focusCell, navigationStyle, setHighlightedIdx],
  );

  const nextPageItemIdx = useCallback(
    (
      key: "PageDown" | "PageUp" | "Home" | "End",
      [rowIdx, colIdx]: CellPos,
    ): Promise<CellPos> =>
      new Promise((resolve) => {
        let newRowIdx = rowIdx;
        const { current: focusState } = cellFocusStateRef;
        switch (key) {
          case "PageDown": {
            newRowIdx = Math.min(rowCount - 1, rowIdx + viewportRowCount);
            if (newRowIdx !== rowIdx) {
              focusState.cellPos = [newRowIdx, colIdx];
              requestScroll?.({ type: "scroll-page", direction: "down" });
            }
            break;
          }
          case "PageUp": {
            newRowIdx = Math.max(0, rowIdx - viewportRowCount);
            if (newRowIdx !== rowIdx) {
              focusState.cellPos = [newRowIdx, colIdx];
              requestScroll?.({ type: "scroll-page", direction: "up" });
            }
            break;
          }
          case "Home": {
            newRowIdx = headerCount + 1;
            if (newRowIdx !== rowIdx) {
              focusState.cellPos = [newRowIdx, colIdx];
              requestScroll?.({ type: "scroll-end", direction: "home" });
            }
            break;
          }
          case "End": {
            newRowIdx = rowCount + headerCount;
            if (newRowIdx !== rowIdx) {
              focusState.cellPos = [newRowIdx, colIdx];
              requestScroll?.({ type: "scroll-end", direction: "end" });
            }
            break;
          }
        }
        // Introduce a delay to allow the scroll operation to complete,
        // which will trigger a range reset and rerender of rows. We
        // might need to tweak how this works. If we introduce too big
        // a delay, we risk seeing the newly rendered rows, with the focus
        // still on the old cell, which will be apparent as a brief flash
        // of the old cell focus before switching to correct cell. If we were
        // to change the way re assign keys such that we can guarantee that
        // when we page down, rows in same position get same keys, then same
        // cell would be focussed in new page as previous and issue would not
        // arise.
        setTimeout(() => {
          resolve([newRowIdx, colIdx]);
        }, 35);
      }),
    [cellFocusStateRef, headerCount, requestScroll, rowCount, viewportRowCount],
  );

  const handleFocus = useCallback(() => {
    if (disableHighlightOnFocus !== true) {
      if (containerRef.current?.contains(document.activeElement)) {
        // IF focus arrives via keyboard, a cell will have received focus,
        // we handle that here. If focus arrives via click on a cell with
        // no tabindex (i.e all cells except one) we leave that to the
        // click handler.
        const focusedCell = getFocusedCell(document.activeElement);
        if (focusedCell) {
          cellFocusStateRef.current.cellPos = getAriaCellPos(focusedCell);
          if (navigationStyle === "row") {
            setHighlightedIdx(cellFocusStateRef.current.cellPos[0]);
          }
        }
      }
    }
  }, [
    disableHighlightOnFocus,
    containerRef,
    cellFocusStateRef,
    navigationStyle,
    setHighlightedIdx,
  ]);

  const navigateChildItems = useCallback(
    async (
      navigationStyle: "cell" | "tree" = "cell",
      key: NavigationKey,
      shiftKey = false,
    ): Promise<undefined> => {
      const { cellPos } = cellFocusStateRef.current;
      const [rowIdx, colIdx] = cellPos;
      let nextRowIdx = -1,
        nextColIdx = -1;

      if (isPagingKey(key)) {
        [nextRowIdx, nextColIdx] = await nextPageItemIdx(key, cellPos);
      } else {
        const treeNodeOperation = getTreeNodeOperation(
          containerRef,
          navigationStyle,
          cellPos,
          key,
          shiftKey,
        );
        if (
          treeNodeOperation === "expand" ||
          treeNodeOperation === "collapse"
        ) {
          onToggleGroup(treeNodeOperation, rowIdx - headerCount - 1);
        } else if (treeNodeOperation === "level-up") {
          [nextRowIdx, nextColIdx] = getLevelUp(containerRef, cellPos);
        } else {
          [nextRowIdx, nextColIdx] = getNextCellPos(
            key,
            cellPos,
            columnCount,
            rowCount,
          );
        }
      }

      if (nextRowIdx !== rowIdx || nextColIdx !== colIdx) {
        setActiveCell(nextRowIdx, nextColIdx, true);
        console.log(`nextRowIdx ${nextRowIdx}`);
        setHighlightedIndex(nextRowIdx);
      }
    },
    [
      cellFocusStateRef,
      nextPageItemIdx,
      containerRef,
      onToggleGroup,
      headerCount,
      columnCount,
      rowCount,
      setActiveCell,
      setHighlightedIndex,
    ],
  );

  const scrollRowIntoViewIfNecessary = useCallback(
    (rowIndex: number) => {
      requestScroll?.({ type: "scroll-row", rowIndex });
    },
    [requestScroll],
  );

  const moveHighlightedRow = useCallback(
    async (key: NavigationKey) => {
      const { current: highlighted } = highlightedIndexRef;
      const [nextRowIdx] = isPagingKey(key)
        ? await nextPageItemIdx(key, [highlighted ?? -1, 0])
        : getNextCellPos(key, [highlighted ?? -1, 0], columnCount, maxRowIndex);
      if (nextRowIdx !== highlighted) {
        setHighlightedIndex(nextRowIdx);
        // TO(DO make this a scroll request)
        scrollRowIntoViewIfNecessary(nextRowIdx);
      }
    },
    [
      columnCount,
      maxRowIndex,
      nextPageItemIdx,
      scrollRowIntoViewIfNecessary,
      setHighlightedIndex,
    ],
  );

  useEffect(() => {
    if (highlightedIndexProp !== undefined && highlightedIndexProp !== -1) {
      requestAnimationFrame(() => {
        // deferred call, ensuring table has fully rendered
        scrollRowIntoViewIfNecessary(highlightedIndexProp);
      });
    }
  }, [highlightedIndexProp, scrollRowIntoViewIfNecessary]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const cell = queryClosest<HTMLDivElement>(
        e.target,
        ".vuuTableCell,.vuuColumnMenu,.vuuTableHeaderCell",
      );
      if (cellDropdownShowing(cell)) {
        return;
      }
      if (rowCount > 0 && isNavigationKey(e.key, navigationStyle)) {
        e.preventDefault();
        e.stopPropagation();
        if (navigationStyle === "row") {
          moveHighlightedRow(e.key);
        } else if (navigationStyle !== "none") {
          if (!focusColumnMenuIfAppropriate(e, cell)) {
            navigateChildItems(navigationStyle, e.key, e.shiftKey);
          }
        }
      }
    },
    [rowCount, navigationStyle, moveHighlightedRow, navigateChildItems],
  );

  const handleClick = useCallback(
    // Might not be a cell e.g the Settings button
    (evt: MouseEvent) => {
      const target = evt.target as HTMLElement;
      const focusedCell = getFocusedCell(target);
      if (focusedCell) {
        const [rowIdx, colIdx] = getAriaCellPos(focusedCell);
        setActiveCell(rowIdx, colIdx);
      }
    },
    [setActiveCell],
  );

  const handleMouseLeave = useCallback(() => {
    setHighlightedIndex(-1);
  }, [setHighlightedIndex]);

  const handleMouseMove = useCallback(
    (evt: MouseEvent) => {
      const rowIdx = closestRowIndex(evt.target as HTMLElement);
      if (rowIdx !== -1 && rowIdx !== highlightedIndexRef.current) {
        setHighlightedIndex(rowIdx);
      }
    },
    [setHighlightedIndex],
  );

  /**
   * used when editing cells
   */
  const navigateCell = useCallback(() => {
    navigateChildItems("cell", "ArrowDown");
  }, [navigateChildItems]);

  return {
    highlightedIndexRef,
    navigateCell,
    onClick: handleClick,
    onFocus: handleFocus,
    onKeyDown: handleKeyDown,
    onMouseLeave: navigationStyle === "row" ? handleMouseLeave : undefined,
    onMouseMove: navigationStyle === "row" ? handleMouseMove : undefined,
  };
};
