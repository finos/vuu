import { VuuRange } from "@finos/vuu-protocol-types";
import {
  KeyboardEvent,
  MouseEvent,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { ScrollDirection, ScrollRequestHandler } from "./useTableScroll";
import {
  CellPos,
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

const howFarIsCellOutsideViewport = (
  cellEl: HTMLElement
): readonly [ScrollDirection | undefined, number | undefined] => {
  //TODO lots of scope for optimisation here
  const scrollbarContainer = cellEl
    .closest(".vuuTableNext")
    ?.querySelector(".vuuTableNext-scrollbarContainer");
  if (scrollbarContainer) {
    const viewport = scrollbarContainer?.getBoundingClientRect();
    const cell = cellEl.closest(".vuuTableNextCell")?.getBoundingClientRect();
    if (cell) {
      if (cell.bottom > viewport.bottom) {
        return ["down", cell.bottom - viewport.bottom];
      } else if (cell.top < viewport.top) {
        return ["up", cell.top - viewport.top];
      } else if (cell.right < viewport.right) {
        return ["right", cell.right - viewport.right];
      } else if (cell.left < viewport.left) {
        return ["left", cell.left - viewport.left];
      } else {
        return NO_SCROLL_NECESSARY;
      }
    } else {
      throw Error("Whats going on, cell not found");
    }
  } else {
    throw Error("Whats going on, scrollbar container not found");
  }
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
    if (colIdx < columnCount - 1) {
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
  disableHighlightOnFocus?: boolean;
  label?: string;
  navigationStyle: TableNavigationStyle;
  viewportRange: VuuRange;
  requestScroll?: ScrollRequestHandler;
  restoreLastFocus?: boolean;
  rowCount?: number;
  selected?: unknown;
  viewportRowCount: number;
}

export const useKeyboardNavigation = ({
  columnCount = 0,
  containerRef,
  disableHighlightOnFocus,
  navigationStyle,
  requestScroll,
  rowCount = 0,
  viewportRowCount,
}: // viewportRange,
NavigationHookProps) => {
  // const { from: viewportFirstRow, to: viewportLastRow } = viewportRange;
  const focusedCellPos = useRef<CellPos>([-1, -1]);
  const focusableCell = useRef<HTMLElement>();
  const activeCellPos = useRef<CellPos>([-1, 0]);

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
          activeCell.focus();
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
      focusCell(pos);
      if (fromKeyboard) {
        focusedCellPos.current = pos;
      }
    },
    [focusCell]
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
        }
      }
    }
  }, [disableHighlightOnFocus, containerRef]);

  const navigateChildItems = useCallback(
    async (key: NavigationKey) => {
      const [nextRowIdx, nextColIdx] = isPagingKey(key)
        ? await nextPageItemIdx(key, activeCellPos.current)
        : nextCellPos(key, activeCellPos.current, columnCount, rowCount);
      console.log(`nextRowIdx ${nextRowIdx} nextColIdx ${nextColIdx}`);

      const [rowIdx, colIdx] = activeCellPos.current;
      if (nextRowIdx !== rowIdx || nextColIdx !== colIdx) {
        setActiveCell(nextRowIdx, nextColIdx, true);
      }
    },
    [columnCount, nextPageItemIdx, rowCount, setActiveCell]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (rowCount > 0 && isNavigationKey(e.key, navigationStyle)) {
        e.preventDefault();
        e.stopPropagation();
        void navigateChildItems(e.key);
      }
    },
    [rowCount, navigationStyle, navigateChildItems]
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

  const navigate = useCallback(() => {
    navigateChildItems("ArrowDown");
  }, [navigateChildItems]);

  const containerProps = useMemo(() => {
    return {
      navigate,
      onClick: handleClick,
      onFocus: handleFocus,
      onKeyDown: handleKeyDown,
    };
  }, [handleClick, handleFocus, handleKeyDown, navigate]);

  // First render will only render the outer container when explicit
  // sizing has not been provided. Outer container is measured and
  // only then, on second render,  is content rendered.
  const fullyRendered = containerRef.current?.firstChild != null;
  useEffect(() => {
    if (fullyRendered && focusableCell.current === undefined) {
      const { current: container } = containerRef;
      const cell = (container?.querySelector(headerCellQuery(0)) ||
        container?.querySelector(dataCellQuery(0, 0))) as HTMLElement;
      if (cell) {
        cell.setAttribute("tabindex", "0");
        focusableCell.current = cell;
      }
    }
  }, [containerRef, fullyRendered]);

  return containerProps;
};
