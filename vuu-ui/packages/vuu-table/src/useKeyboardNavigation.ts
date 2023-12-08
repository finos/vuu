import { useControlled } from "@salt-ds/core";
import { VuuRange } from "@finos/vuu-protocol-types";
import {
  KeyboardEvent,
  MouseEvent,
  RefObject,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { ScrollDirection, ScrollRequestHandler } from "./useTableScroll";
import {
  CellPos,
  closestRowIndex,
  dataCellQuery,
  getTableCell,
  headerCellQuery,
} from "./table-dom-utils";
import { TableNavigationStyle } from "../table/dataTableTypes";

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
  navigationStyle: TableNavigationStyle
): key is NavigationKey => {
  switch (navigationStyle) {
    case "cell":
      return cellNavigationKeys.has(key as NavigationKey);
    case "row":
      return rowNavigationKeys.has(key as NavigationKey);
    default:
      return false;
  }
};

type ArrowKey = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";
type PageKey = "Home" | "End" | "PageUp" | "PageDown";
type NavigationKey = PageKey | ArrowKey;

const PageKeys = ["Home", "End", "PageUp", "PageDown"];
export const isPagingKey = (key: string): key is PageKey =>
  PageKeys.includes(key);

const NULL_CELL_POS: CellPos = [-1, -1];

const NO_SCROLL_NECESSARY = [undefined, undefined] as const;

const howFarIsRowOutsideViewport = (
  rowEl: HTMLElement,
  contentContainer = rowEl.closest(".vuuTableNext-contentContainer")
): readonly [ScrollDirection | undefined, number | undefined] => {
  //TODO lots of scope for optimisation here
  if (contentContainer) {
    const viewport = contentContainer?.getBoundingClientRect();
    const row = rowEl.getBoundingClientRect();
    if (row) {
      if (row.bottom > viewport.bottom) {
        return ["down", row.bottom - viewport.bottom];
      } else if (row.top < viewport.top) {
        return ["up", row.top - viewport.top];
      } else {
        return NO_SCROLL_NECESSARY;
      }
    } else {
      throw Error("Whats going on, row not found");
    }
  } else {
    throw Error("Whats going on, scrollbar container not found");
  }
};

const howFarIsCellOutsideViewport = (
  cellEl: HTMLElement
): readonly [ScrollDirection | undefined, number | undefined] => {
  //TODO lots of scope for optimisation here
  const contentContainer = cellEl.closest(".vuuTableNext-contentContainer");
  if (contentContainer) {
    const rowEl = cellEl.closest(".vuuTableNextRow") as HTMLElement;
    if (rowEl) {
      const result = howFarIsRowOutsideViewport(rowEl, contentContainer);
      if (result !== NO_SCROLL_NECESSARY) {
        return result;
      }
      const viewport = contentContainer?.getBoundingClientRect();
      const cell = cellEl.closest(".vuuTableNextCell")?.getBoundingClientRect();
      if (cell) {
        if (cell.right > viewport.right) {
          return ["right", cell.right + 6 - viewport.right];
        } else if (cell.left < viewport.left) {
          return ["left", cell.left - viewport.left];
        }
      } else {
        throw Error("Whats going on, cell not found");
      }
    }
  }
  return NO_SCROLL_NECESSARY;
};

function nextCellPos(
  key: ArrowKey,
  [rowIdx, colIdx]: CellPos,
  columnCount: number,
  rowCount: number
): CellPos {
  if (key === "ArrowUp") {
    if (rowIdx > -1) {
      return [rowIdx - 1, colIdx];
    } else {
      return [rowIdx, colIdx];
    }
  } else if (key === "ArrowDown") {
    if (rowIdx === -1) {
      return [0, colIdx];
    } else if (rowIdx === rowCount - 1) {
      return [rowIdx, colIdx];
    } else {
      return [rowIdx + 1, colIdx];
    }
  } else if (key === "ArrowRight") {
    // The colIdx is 1 based, because of the selection decorator
    if (colIdx < columnCount) {
      return [rowIdx, colIdx + 1];
    } else {
      return [rowIdx, colIdx];
    }
  } else if (key === "ArrowLeft") {
    if (colIdx > 1) {
      return [rowIdx, colIdx - 1];
    } else {
      return [rowIdx, colIdx];
    }
  }
  return [rowIdx, colIdx];
}

export interface NavigationHookProps {
  containerRef: RefObject<HTMLElement>;
  columnCount?: number;
  defaultHighlightedIndex?: number;
  disableFocus?: boolean;
  disableHighlightOnFocus?: boolean;
  highlightedIndex?: number;
  label?: string;
  navigationStyle: TableNavigationStyle;
  viewportRange: VuuRange;
  onHighlight?: (idx: number) => void;
  requestScroll?: ScrollRequestHandler;
  restoreLastFocus?: boolean;
  rowCount?: number;
  selected?: unknown;
  viewportRowCount: number;
}

export const useKeyboardNavigation = ({
  columnCount = 0,
  containerRef,
  disableFocus = false,
  defaultHighlightedIndex,
  disableHighlightOnFocus,
  highlightedIndex: highlightedIndexProp,
  navigationStyle,
  requestScroll,
  onHighlight,
  rowCount = 0,
  viewportRowCount,
}: // viewportRange,
NavigationHookProps) => {
  // const { from: viewportFirstRow, to: viewportLastRow } = viewportRange;
  const focusedCellPos = useRef<CellPos>([-1, -1]);
  const focusableCell = useRef<HTMLElement>();
  const activeCellPos = useRef<CellPos>([-1, 0]);
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
  const setHighlightedIndex = useCallback(
    (idx: number, fromKeyboard = false) => {
      onHighlight?.(idx);
      setHighlightedIdx(idx);
      if (fromKeyboard) {
        // lastFocus.current = idx;
      }
    },
    [onHighlight, setHighlightedIdx]
  );

  const getFocusedCell = (element: HTMLElement | Element | null) =>
    element?.closest(
      "[role='columnHeader'],[role='cell']"
    ) as HTMLDivElement | null;

  const getTableCellPos = (tableCell: HTMLDivElement): CellPos => {
    if (tableCell.role === "columnHeader") {
      const colIdx = parseInt(tableCell.dataset.idx ?? "-1", 10);
      return [-1, colIdx];
    } else {
      const focusedRow = tableCell.closest("[role='row']");
      if (focusedRow) {
        const rowIdx = parseInt(focusedRow.ariaRowIndex ?? "-1", 10);
        // TODO will get trickier when we introduce horizontal virtualisation
        const colIdx = Array.from(focusedRow.childNodes).indexOf(tableCell);
        return [rowIdx, colIdx];
      }
    }
    return NULL_CELL_POS;
  };

  const focusCell = useCallback(
    (cellPos: CellPos) => {
      if (containerRef.current) {
        const activeCell = getTableCell(containerRef, cellPos);
        if (activeCell) {
          if (activeCell !== focusableCell.current) {
            focusableCell.current?.removeAttribute("tabindex");
            focusableCell.current = activeCell;
            activeCell.setAttribute("tabindex", "0");
          }
          const [direction, distance] = howFarIsCellOutsideViewport(activeCell);
          if (direction && distance) {
            requestScroll?.({ type: "scroll-distance", distance, direction });
          }
          console.log(`activeCell focus`);
          activeCell.focus({ preventScroll: true });
        }
      }
    },
    // TODO we recreate this function whenever viewportRange changes, which will
    // be often whilst scrolling - store range in a a ref ?
    [containerRef, requestScroll]
  );

  const setActiveCell = useCallback(
    (rowIdx: number, colIdx: number, fromKeyboard = false) => {
      const pos: CellPos = [rowIdx, colIdx];
      activeCellPos.current = pos;
      if (navigationStyle === "row") {
        setHighlightedIdx(rowIdx);
      } else {
        focusCell(pos);
      }
      if (fromKeyboard) {
        focusedCellPos.current = pos;
      }
    },
    [focusCell, navigationStyle, setHighlightedIdx]
  );

  const nextPageItemIdx = useCallback(
    (
      key: "PageDown" | "PageUp" | "Home" | "End",
      [rowIdx, colIdx]: CellPos
    ): Promise<CellPos> =>
      new Promise((resolve) => {
        let newRowIdx = rowIdx;
        switch (key) {
          case "PageDown":
            newRowIdx = Math.min(rowCount - 1, rowIdx + viewportRowCount);
            requestScroll?.({ type: "scroll-page", direction: "down" });
            break;
          case "PageUp":
            newRowIdx = Math.max(0, rowIdx - viewportRowCount);
            requestScroll?.({ type: "scroll-page", direction: "up" });
            break;
          case "Home":
            newRowIdx = 0;
            requestScroll?.({ type: "scroll-end", direction: "home" });
            break;
          case "End":
            newRowIdx = rowCount - 1;
            requestScroll?.({ type: "scroll-end", direction: "end" });
            break;
        }
        setTimeout(() => {
          resolve([newRowIdx, colIdx]);
        }, 90);
      }),
    [requestScroll, rowCount, viewportRowCount]
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
          focusedCellPos.current = getTableCellPos(focusedCell);
          if (navigationStyle === "row") {
            setHighlightedIdx(focusedCellPos.current[0]);
          }
        }
      }
    }
  }, [
    disableHighlightOnFocus,
    containerRef,
    navigationStyle,
    setHighlightedIdx,
  ]);

  const navigateChildItems = useCallback(
    async (key: NavigationKey) => {
      const [nextRowIdx, nextColIdx] = isPagingKey(key)
        ? await nextPageItemIdx(key, activeCellPos.current)
        : nextCellPos(key, activeCellPos.current, columnCount, rowCount);
      const [rowIdx, colIdx] = activeCellPos.current;
      if (nextRowIdx !== rowIdx || nextColIdx !== colIdx) {
        setActiveCell(nextRowIdx, nextColIdx, true);
      }
    },
    [columnCount, nextPageItemIdx, rowCount, setActiveCell]
  );

  const scrollRowIntoViewIfNecessary = useCallback(
    (rowIndex: number) => {
      const { current: container } = containerRef;
      const activeRow = container?.querySelector(
        `[aria-rowindex="${rowIndex}"]`
      ) as HTMLElement;
      if (activeRow) {
        const [direction, distance] = howFarIsRowOutsideViewport(activeRow);
        if (direction && distance) {
          requestScroll?.({ type: "scroll-distance", distance, direction });
        }
      }
    },
    [containerRef, requestScroll]
  );

  const moveHighlightedRow = useCallback(
    async (key: NavigationKey) => {
      const { current: highlighted } = highlightedIndexRef;
      const [nextRowIdx] = isPagingKey(key)
        ? await nextPageItemIdx(key, [highlighted ?? -1, 0])
        : nextCellPos(key, [highlighted ?? -1, 0], columnCount, rowCount);
      if (nextRowIdx !== highlighted) {
        setHighlightedIndex(nextRowIdx);
        scrollRowIntoViewIfNecessary(nextRowIdx);
      }
    },
    [
      columnCount,
      nextPageItemIdx,
      rowCount,
      scrollRowIntoViewIfNecessary,
      setHighlightedIndex,
    ]
  );

  useEffect(() => {
    if (highlightedIndexProp !== undefined && highlightedIndexProp !== -1) {
      scrollRowIntoViewIfNecessary(highlightedIndexProp);
    }
  }, [highlightedIndexProp, scrollRowIntoViewIfNecessary]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (rowCount > 0 && isNavigationKey(e.key, navigationStyle)) {
        e.preventDefault();
        e.stopPropagation();
        if (navigationStyle === "row") {
          moveHighlightedRow(e.key);
        } else {
          void navigateChildItems(e.key);
        }
      }
    },
    [rowCount, navigationStyle, moveHighlightedRow, navigateChildItems]
  );

  const handleClick = useCallback(
    // Might not be a cell e.g the Settings button
    (evt: MouseEvent) => {
      const target = evt.target as HTMLElement;
      const focusedCell = getFocusedCell(target);
      if (focusedCell) {
        const [rowIdx, colIdx] = getTableCellPos(focusedCell);
        setActiveCell(rowIdx, colIdx);
      }
    },
    [setActiveCell]
  );

  const handleMouseLeave = useCallback(() => {
    setHighlightedIndex(-1);
  }, [setHighlightedIndex]);

  const handleMouseMove = useCallback(
    (evt: MouseEvent) => {
      const idx = closestRowIndex(evt.target as HTMLElement);
      if (idx !== -1 && idx !== highlightedIndexRef.current) {
        setHighlightedIndex(idx);
      }
    },
    [setHighlightedIndex]
  );

  const navigate = useCallback(() => {
    navigateChildItems("ArrowDown");
  }, [navigateChildItems]);

  // First render will only render the outer container when explicit
  // sizing has not been provided. Outer container is measured and
  // only then, on second render,  is content rendered.
  const fullyRendered = containerRef.current?.firstChild != null;
  useEffect(() => {
    if (fullyRendered && focusableCell.current === undefined && !disableFocus) {
      const { current: container } = containerRef;
      const cell = (container?.querySelector(headerCellQuery(0)) ||
        container?.querySelector(dataCellQuery(0, 0))) as HTMLElement;
      if (cell) {
        cell.setAttribute("tabindex", "0");
        focusableCell.current = cell;
      }
    }
  }, [containerRef, disableFocus, fullyRendered]);

  return {
    highlightedIndexRef,
    navigate,
    onClick: handleClick,
    onFocus: handleFocus,
    onKeyDown: handleKeyDown,
    onMouseLeave: navigationStyle === "row" ? handleMouseLeave : undefined,
    onMouseMove: navigationStyle === "row" ? handleMouseMove : undefined,
  };
};
