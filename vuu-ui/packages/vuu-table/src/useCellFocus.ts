import { RefCallback, RefObject, useCallback, useRef } from "react";
import {
  CellPos,
  dataCellQuery,
  getTableCell,
  headerCellQuery,
} from "./table-dom-utils";
import { ScrollRequestHandler } from "./useTableScroll";
import { queryClosest } from "@finos/vuu-utils";

export interface CellFocusHookProps {
  containerRef: RefObject<HTMLElement>;
  disableFocus?: boolean;
  requestScroll?: ScrollRequestHandler;
}

export type FocusCell = (cellPos: CellPos) => void;

export const useCellFocus = ({
  containerRef,
  disableFocus = false,
  requestScroll,
}: CellFocusHookProps) => {
  const focusableCell = useRef<HTMLElement>();

  const focusCell = useCallback<FocusCell>(
    (cellPos) => {
      if (containerRef.current) {
        const activeCell = getTableCell(containerRef, cellPos);
        if (activeCell) {
          if (activeCell !== focusableCell.current) {
            focusableCell.current?.removeAttribute("tabindex");
            focusableCell.current = activeCell;
            activeCell.setAttribute("tabindex", "0");
          }
          // TODO needs to be scroll cell
          requestScroll?.({ type: "scroll-row", rowIndex: cellPos[0] });
          activeCell.focus({ preventScroll: true });
        }
      }
    },
    // TODO we recreate this function whenever viewportRange changes, which will
    // be often whilst scrolling - store range in a a ref ?
    [containerRef, requestScroll],
  );

  const tableBodyRef = useCallback<RefCallback<HTMLDivElement>>(
    (el) => {
      if (el) {
        const table = queryClosest<HTMLDivElement>(el, ".vuuTable");
        if (table) {
          if (focusableCell.current === undefined && !disableFocus) {
            const cell =
              table.querySelector<HTMLDivElement>(headerCellQuery(0)) ||
              table.querySelector<HTMLDivElement>(dataCellQuery(0, 0));
            if (cell) {
              cell.setAttribute("tabindex", "0");
              focusableCell.current = cell;
            }
          }
        }
      }
    },
    [disableFocus],
  );

  return {
    focusCell,
    tableBodyRef,
  };
};
