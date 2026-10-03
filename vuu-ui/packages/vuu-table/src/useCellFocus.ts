import {
  KeyboardEventHandler,
  RefCallback,
  RefObject,
  useCallback,
  useLayoutEffect,
  useRef,
} from "react";
import {
  dataCellQuery,
  getAriaCellPos,
  getTableCell,
  headerCellQuery,
} from "./table-dom-utils";
import { ScrollRequestHandler } from "./useTableScroll";
import { isArrowKey, queryClosest } from "@vuu-ui/vuu-utils";
import { CellPos } from "@vuu-ui/vuu-table-types";
import type { ICellFocusState } from "./CellFocusState";

export interface CellFocusHookProps {
  cellFocusStateRef: RefObject<ICellFocusState>;
  containerRef: RefObject<HTMLElement | null>;
  disableFocus?: boolean;
  requestScroll?: ScrollRequestHandler;
}

const getCellPosition = (el: HTMLElement) => {
  const top = parseInt(el.parentElement?.style.top ?? "-1");
  return { top };
};

const isDifferentCellPosition = (
  currentPos: CellPos | undefined,
  newPos: CellPos,
) => {
  if (currentPos === undefined) {
    return true;
  }
  return currentPos[0] !== newPos[0] || currentPos[1] !== newPos[1];
};

export type FocusCell = (cellPos: CellPos, fromKeyboard?: boolean) => void;
/**
 * Focus a cell once it has been rendered. Used when the operation that
 * moves focus (e.g. paging) also re-renders rows, so the target cell
 * may not yet be in the DOM, or may be about to be reused for another row.
 */
export type FocusCellWhenRendered = (cellPos: CellPos) => void;

const isSameCellPosition = (pos1: CellPos | undefined, pos2: CellPos) =>
  pos1 !== undefined && pos1[0] === pos2[0] && pos1[1] === pos2[1];

export const useCellFocus = ({
  cellFocusStateRef,
  containerRef,
  disableFocus = false,
  requestScroll,
}: CellFocusHookProps) => {
  const focusCellPlaceholderRef = useCallback<RefCallback<HTMLDivElement>>(
    (el) => {
      cellFocusStateRef.current.placeholderEl = el;
    },
    [cellFocusStateRef],
  );

  const renderCountRef = useRef(0);

  const moveFocusToCell = useCallback(
    (cellPos: CellPos, activeCell: HTMLElement) => {
      const { current: state } = cellFocusStateRef;
      if (activeCell !== state.el) {
        state.el?.removeAttribute("tabindex");
        activeCell.setAttribute("tabindex", "0");

        state.el = activeCell;
        state.pos = getCellPosition(activeCell);
        state.outsideViewport = false;

        if (state.placeholderEl) {
          state.placeholderEl.style.top = `${state.pos.top}px`;
        }
      }
      state.cellPos = cellPos;
      activeCell.focus({ preventScroll: true });
    },
    [cellFocusStateRef],
  );

  const focusCell = useCallback<FocusCell>(
    (cellPos) => {
      if (containerRef.current) {
        const { current: state } = cellFocusStateRef;
        state.pendingCellPos = undefined;
        if (isDifferentCellPosition(state.cellPos, cellPos)) {
          const activeCell = getTableCell(containerRef, cellPos);
          if (activeCell) {
            state.cellPos = cellPos;
            requestScroll?.({ type: "scroll-row", rowIndex: cellPos[0] });
            moveFocusToCell(cellPos, activeCell);
          }
        }
      }
    },
    [cellFocusStateRef, containerRef, moveFocusToCell, requestScroll],
  );

  /**
   * The operation that requested this focus change is responsible for
   * scrolling the target cell into view, so no scroll is requested here.
   */
  const applyPendingFocus = useCallback(() => {
    const { current: state } = cellFocusStateRef;
    const { pendingCellPos } = state;
    if (pendingCellPos) {
      const activeCell = getTableCell(containerRef, pendingCellPos);
      if (activeCell) {
        state.pendingCellPos = undefined;
        moveFocusToCell(pendingCellPos, activeCell);
      }
    }
  }, [cellFocusStateRef, containerRef, moveFocusToCell]);

  const focusCellWhenRendered = useCallback<FocusCellWhenRendered>(
    (cellPos) => {
      const { current: state } = cellFocusStateRef;
      state.pendingCellPos = cellPos;
      // Pending focus is normally applied after the next render. If the
      // operation does not trigger a render, apply it here instead.
      const renderCount = renderCountRef.current;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (
            state.pendingCellPos === cellPos &&
            renderCountRef.current === renderCount
          ) {
            applyPendingFocus();
          }
        });
      });
    },
    [applyPendingFocus, cellFocusStateRef],
  );

  /**
   * Row elements are reused as rows are scrolled, so the element with focus
   * may now represent a different row. If so, move focus to the correct cell.
   */
  const verifyFocus = useCallback(() => {
    const { current: state } = cellFocusStateRef;
    const { activeElement } = document;
    if (
      state.cellPos &&
      activeElement instanceof HTMLElement &&
      activeElement.role === "cell" &&
      containerRef.current?.contains(activeElement)
    ) {
      const focusedCellPos = getAriaCellPos(activeElement as HTMLDivElement);
      if (!isSameCellPosition(focusedCellPos, state.cellPos)) {
        const activeCell = getTableCell(containerRef, state.cellPos);
        if (activeCell) {
          moveFocusToCell(state.cellPos, activeCell);
        }
      }
    }
  }, [cellFocusStateRef, containerRef, moveFocusToCell]);

  useLayoutEffect(() => {
    renderCountRef.current += 1;
    if (cellFocusStateRef.current.pendingCellPos) {
      applyPendingFocus();
    } else {
      verifyFocus();
    }
  });

  const setTableBodyRef = useCallback<RefCallback<HTMLDivElement>>(
    (el) => {
      if (el) {
        const { current: state } = cellFocusStateRef;
        const table = queryClosest<HTMLDivElement>(el, ".vuuTable");
        if (table) {
          if (state.el === null && !disableFocus) {
            const headerCell = table.querySelector<HTMLDivElement>(
              headerCellQuery(1),
            );
            if (headerCell) {
              headerCell.setAttribute("tabindex", "0");
              state.cellPos = [1, 1];
              state.el = headerCell;
              state.pos = { top: -20 };
              if (state.placeholderEl) {
                state.placeholderEl.style.top = `-20px`;
              }
            } else {
              const cell = table.querySelector<HTMLDivElement>(
                dataCellQuery(0, 0),
              );
              if (cell) {
                cell.setAttribute("tabindex", "0");
                state.cellPos = [1, 1];
                state.el = cell;
                state.pos = { top: 0 };
                if (state.placeholderEl) {
                  state.placeholderEl.style.top = `0px`;
                }
              }
            }
          }
        }
      }
    },
    [cellFocusStateRef, disableFocus],
  );

  const focusCellPlaceholderKeyDown = useCallback<KeyboardEventHandler>(
    (evt) => {
      const { outsideViewport, pos } = cellFocusStateRef.current;
      if (pos && isArrowKey(evt.key)) {
        // TODO depends on whether we're scrolling up or down
        if (outsideViewport === "above") {
          requestScroll?.({ type: "scroll-top", scrollPos: pos.top });
        } else if (outsideViewport === "below") {
          requestScroll?.({ type: "scroll-bottom", scrollPos: pos.top });
        } else {
          throw Error(
            `cellFocusPlaceholder should not have focus if inside viewport`,
          );
        }
      }
    },
    [cellFocusStateRef, requestScroll],
  );

  return {
    focusCell,
    focusCellWhenRendered,
    focusCellPlaceholderKeyDown,
    focusCellPlaceholderRef,
    setTableBodyRef,
  };
};
