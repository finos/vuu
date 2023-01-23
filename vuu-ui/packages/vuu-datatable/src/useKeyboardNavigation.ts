import { DataSourceRow } from "@finos/vuu-data";
import {
  KeyboardEvent,
  MouseEvent,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  End,
  Home,
  isNavigationKey,
  PageDown,
  PageUp,
} from "./keyUtils";
import { ScrollRequestHandler } from "./useTableScroll";

export type CellPos = [number, number];

const headerCellQuery = (colIdx: number) => `thead th:nth-child(${colIdx + 1})`;
const dataCellQuery = (rowIdx: number, colIdx: number) =>
  `tbody > tr[data-idx='${rowIdx}'] > td:nth-child(${colIdx + 1})`;

function nextCellPos(
  key: string,
  [rowIdx, colIdx]: CellPos,
  columnCount: number,
  rowCount: number
): CellPos {
  if (key === ArrowUp || key === End) {
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
}: NavigationHookProps) => {
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
    element?.closest("th,td") as HTMLTableCellElement;

  const getTableCellPos = (tableCell: HTMLTableCellElement): CellPos => {
    if (tableCell.tagName === "TH") {
      const colIdx = parseInt(tableCell.dataset.idx ?? "-1", 10);
      return [-1, colIdx];
    } else {
      const focusedRow = tableCell.closest("tr");
      if (focusedRow) {
        const rowIdx = parseInt(focusedRow.dataset.idx ?? "-1", 10);
        // TODO will get trickier when we introduce horizontal virtualisation
        const colIdx = Array.from(focusedRow.childNodes).indexOf(tableCell);
        return [rowIdx, colIdx];
      }
    }
    return [-1, -1];
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
        }
      }
    },
    [containerRef, getTableCell]
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
    async (e: KeyboardEvent) => {
      const [nextRowIdx, nextColIdx] =
        e.key === PageDown ||
        e.key === PageUp ||
        e.key === End ||
        e.key === Home
          ? await nextPageItemIdx(e.key, activeCellPos.current)
          : nextCellPos(e.key, activeCellPos.current, columnCount, rowCount);

      if (
        nextRowIdx !== activeCellPos.current[0] ||
        nextColIdx !== activeCellPos.current[1]
      ) {
        setActiveCell(nextRowIdx, nextColIdx, true);
      }
    },
    [columnCount, nextPageItemIdx, rowCount, setActiveCell]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (data.length > 0 && isNavigationKey(e)) {
        e.preventDefault();
        e.stopPropagation();
        void navigateChildItems(e);
      }
    },
    [data, navigateChildItems]
  );

  const handleClick = useCallback(
    (evt: MouseEvent) => {
      const target = evt.target as HTMLElement;
      const tableCell = getFocusedCell(target);
      const [rowIdx, colIdx] = getTableCellPos(tableCell);
      setActiveCell(rowIdx, colIdx);
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
