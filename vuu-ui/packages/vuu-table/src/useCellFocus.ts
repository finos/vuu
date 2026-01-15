import {
  KeyboardEventHandler,
  RefCallback,
  RefObject,
  useCallback,
} from "react";
import {
  dataCellQuery,
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

  const focusCell = useCallback<FocusCell>(
    (cellPos) => {
      if (containerRef.current) {
        const { current: state } = cellFocusStateRef;
        if (isDifferentCellPosition(state.cellPos, cellPos)) {
          const activeCell = getTableCell(containerRef, cellPos);
          if (activeCell) {
            if (activeCell !== state.el) {
              state.el?.removeAttribute("tabindex");
              activeCell.setAttribute("tabindex", "0");

              // TODO no need to measure if we're navigating horizontally
              // state.cellPos = cellPos;
              state.el = activeCell;
              state.pos = getCellPosition(activeCell);
              state.outsideViewport = false;

              if (state.placeholderEl) {
                state.placeholderEl.style.top = `${state.pos.top}px`;
              }
            }
            state.cellPos = cellPos;

            // TODO needs to be scroll cell to accommodate horizontal virtualization
            requestScroll?.({ type: "scroll-row", rowIndex: cellPos[0] });
            activeCell.focus({ preventScroll: true });
          }
        }
      }
    },
    [cellFocusStateRef, containerRef, requestScroll],
  );

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
    focusCellPlaceholderKeyDown,
    focusCellPlaceholderRef,
    setTableBodyRef,
  };
};
