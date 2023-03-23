import { DataSourceRow } from "@finos/vuu-data";
import { VuuRange } from "@finos/vuu-protocol-types";
import { withinRange } from "@finos/vuu-utils";
import {
  KeyboardEvent,
  MouseEvent,
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import {
  ArrowDown,
  ArrowKey,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  End,
  Home,
  isNavigationKey,
  isPagingKey,
  NavigationKey,
  PageDown,
  PageUp,
} from "./keyUtils";
import { ScrollRequestHandler } from "./useTableScroll";

export type CellPos = [number, number];

const headerCellQuery = (colIdx: number) => `thead th:nth-child(${colIdx + 1})`;
const dataCellQuery = (rowIdx: number, colIdx: number) =>
  `tbody > tr[aria-rowindex='${rowIdx}'] > td:nth-child(${colIdx + 1})`;

const NULL_CELL_POS: CellPos = [-1, -1];

function nextCellPos(
  key: ArrowKey,
  [rowIdx, colIdx]: CellPos,
  columnCount: number,
  rowCount: number
): CellPos {
  if (key === ArrowUp) {
    if (rowIdx > -1) {
      return [rowIdx - 1, colIdx];
    } else {
      return [rowIdx, colIdx];
    }
  } else if (key === ArrowDown) {
    if (rowIdx === -1) {
      return [0, colIdx];
    } else if (rowIdx === rowCount - 1) {
      return [rowIdx, colIdx];
    } else {
      return [rowIdx + 1, colIdx];
    }
  } else if (key === ArrowRight) {
    if (colIdx < columnCount - 1) {
      return [rowIdx, colIdx + 1];
    } else {
      return [rowIdx, colIdx];
    }
  } else if (key === ArrowLeft) {
    if (colIdx > 0) {
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
  data: DataSourceRow[];
  disableHighlightOnFocus?: boolean;
  label?: string;
  viewportRange: VuuRange;
  requestScroll?: ScrollRequestHandler;
  restoreLastFocus?: boolean;
  rowCount?: number;
  selected?: unknown;
}

export const useKeyboardNavigation = ({
  columnCount = 0,
  containerRef,
  disableHighlightOnFocus,
  data,
  requestScroll,
  rowCount = 0,
  viewportRange,
}: NavigationHookProps) => {
  const { from: viewportFirstRow, to: viewportLastRow } = viewportRange;
  const focusedCellPos = useRef<CellPos>([-1, -1]);
  const focusableCell = useRef<HTMLTableCellElement>();
  const activeCellPos = useRef<CellPos>([-1, 0]);

  const getTableCell = useCallback(
    ([rowIdx, colIdx]: CellPos) => {
      const cssQuery =
        rowIdx === -1 ? headerCellQuery(colIdx) : dataCellQuery(rowIdx, colIdx);
      return containerRef.current?.querySelector(
        cssQuery
      ) as HTMLTableCellElement;
    },
    [containerRef]
  );

  const getFocusedCell = (element: HTMLElement | Element | null) =>
    element?.closest("th,td") as HTMLTableCellElement | null;

  const getTableCellPos = (tableCell: HTMLTableCellElement): CellPos => {
    if (tableCell.tagName === "TH") {
      const colIdx = parseInt(tableCell.dataset.idx ?? "-1", 10);
      return [-1, colIdx];
    } else {
      const focusedRow = tableCell.closest("tr");
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
        const activeCell = getTableCell(cellPos);
        if (activeCell) {
          if (activeCell !== focusableCell.current) {
            focusableCell.current?.setAttribute("tabindex", "");
            focusableCell.current = activeCell;
            activeCell.setAttribute("tabindex", "0");
          }
          activeCell.focus();
        } else if (!withinRange(cellPos[0], viewportRange)) {
          focusableCell.current = undefined;
          requestScroll?.({ type: "scroll-page", direction: "up" });
        }
      }
    },
    // TODO we recreate this function whenever viewportRange changes, which will
    // be often whilst scrolling - store range in a a ref ?
    [containerRef, getTableCell, requestScroll, viewportRange]
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

  const virtualizeActiveCell = useCallback(() => {
    focusableCell.current?.setAttribute("tabindex", "");
    focusableCell.current = undefined;
  }, []);

  const nextPageItemIdx = useCallback(
    async (
      key: "PageDown" | "PageUp" | "Home" | "End",
      cellPos: CellPos
    ): Promise<CellPos> => {
      switch (key) {
        case PageDown:
          requestScroll?.({ type: "scroll-page", direction: "down" });
          break;
        case PageUp:
          requestScroll?.({ type: "scroll-page", direction: "up" });
          break;
        case Home:
          requestScroll?.({ type: "scroll-end", direction: "home" });
          break;
        case End:
          requestScroll?.({ type: "scroll-end", direction: "end" });
          break;
      }
      // TODO set up a scroll listener here, reset focused cell once scroll completes
      return cellPos;
    },
    [requestScroll]
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

      const [rowIdx, colIdx] = activeCellPos.current;
      if (nextRowIdx !== rowIdx || nextColIdx !== colIdx) {
        setActiveCell(nextRowIdx, nextColIdx, true);
      }
    },
    [columnCount, nextPageItemIdx, rowCount, setActiveCell]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (data.length > 0 && isNavigationKey(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        void navigateChildItems(e.key);
      }
    },
    [data, navigateChildItems]
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

  const containerProps = useMemo(() => {
    return {
      onClick: handleClick,
      onFocus: handleFocus,
      onKeyDown: handleKeyDown,
    };
  }, [handleClick, handleFocus, handleKeyDown]);

  useLayoutEffect(() => {
    const { current: cellPos } = activeCellPos;
    const withinViewport =
      cellPos[0] >= viewportFirstRow && cellPos[0] <= viewportLastRow;

    if (focusableCell.current && !withinViewport) {
      virtualizeActiveCell();
    } else if (!focusableCell.current && withinViewport) {
      focusCell(cellPos);
    }
  }, [focusCell, viewportFirstRow, viewportLastRow, virtualizeActiveCell]);

  // First render will only render the outer container when explicit
  // sizing has not been provided. Outer container is measured and
  // only then, on second render,  is content rendered.
  const fullyRendered = containerRef.current?.firstChild != null;
  useEffect(() => {
    if (fullyRendered && focusableCell.current === undefined) {
      const headerCell = containerRef.current?.querySelector(
        headerCellQuery(0)
      ) as HTMLTableCellElement;
      if (headerCell) {
        headerCell.setAttribute("tabindex", "0");
        focusableCell.current = headerCell;
      }
    }
  }, [containerRef, fullyRendered]);

  return containerProps;
};
