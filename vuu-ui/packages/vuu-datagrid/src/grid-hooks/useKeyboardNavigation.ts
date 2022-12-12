import { VuuRange } from "@vuu-ui/vuu-protocol-types";
import { getFullRange } from "@vuu-ui/vuu-utils/src/range-utils";
import { MutableRefObject, useCallback, useEffect, useRef } from "react";
import { GridModelType } from "../grid-model";

type RowNavKey = "ArrowUp" | "ArrowDown";
type ColNavKey = "ArrowLeft" | "ArrowRight";

const isRowNavKey = (key: string): key is RowNavKey =>
  key === "ArrowUp" || key === "ArrowDown";

const isColNavKey = (key: string): key is ColNavKey =>
  key === "ArrowLeft" || key === "ArrowRight";

const RowNavKey = {
  ArrowUp: true,
  ArrowDown: true,
};

const ColNavKey = {
  ArrowLeft: true,
  ArrowRight: true,
};

const NavKey = {
  Tab: true,
  ...RowNavKey,
  ...ColNavKey,
};

const isInteger = (num: number) => Math.floor(num) === num;

type FocusState = {
  cell: number;
  col: number;
  hasFocus: boolean;
  isHeaderCell: boolean;
  row: number;
};

export const useKeyboardNavigation = (
  rootRef: MutableRefObject<HTMLDivElement | null>,
  gridModel: GridModelType
) => {
  const headerRows = 1;
  const range = useRef<VuuRange | null>(null);
  const focusState = useRef<FocusState>({
    hasFocus: false,
    isHeaderCell: false,
    row: -1,
    cell: -1,
    col: -1,
  });
  const allowCellSelection = gridModel.cellSelectionModel !== "none";

  useEffect(() => {
    if (gridModel.viewportRowCount) {
      range.current = { from: 0, to: gridModel.viewportRowCount };
    }
  }, [gridModel.viewportRowCount]);

  const setRange = useCallback(
    (value) => {
      // remove focus from cell out of window
      range.current = value;
      if (
        focusState.current.row < value.from ||
        focusState.current.row >= value.to
      ) {
        // shift focus to placehgolder
        rootRef.current?.focus();
      }
    },
    [rootRef]
  );

  const focusHeaderCell = useCallback(
    (row, col = focusState.current.col) => {
      const focus = focusState.current;
      const { col: currentCol, row: currentRow } = focus;

      focus.isHeaderCell = true;
      focus.row = row;
      focus.col = col;
      if (currentCol !== -1 && currentRow !== -1) {
        const currentTarget =
          currentRow === 0
            ? rootRef.current?.querySelector(
                `.hwHeaderCell:nth-child(${currentCol + 1})`
              )
            : rootRef.current
                ?.querySelector(`.GridRow[data-idx="${currentRow}"]`)
                ?.querySelector(
                  `.vuuDataGridCell:nth-child(${currentCol + 1})`
                );
        if (currentTarget) {
          currentTarget.setAttribute("tabindex", "-1");
        }
      }

      const target = rootRef.current?.querySelector(
        `.hwHeaderCell:nth-child(${col + 1})`
      ) as HTMLElement;
      if (target) {
        target?.focus();
        target.setAttribute("tabindex", "0");
      }
    },
    [rootRef]
  );

  const focusCell = useCallback(
    (row, col = focusState.current.col) => {
      const focus = focusState.current;
      focus.isHeaderCell = false;
      focus.row = row;
      focus.col = col;
      const target = rootRef.current
        ?.querySelector(`.GridRow[data-idx="${row}"]`)
        ?.querySelector(
          `.vuuDataGridCell:nth-child(${col + 1})`
        ) as HTMLElement;
      if (target) {
        target?.focus();
      }
    },
    [rootRef]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (NavKey && range.current) {
        const { isHeaderCell, row, col } = focusState.current;
        if (isRowNavKey(e.key)) {
          const { from, to } = range.current;
          const fullRange = getFullRange(
            range.current,
            gridModel.renderBufferSize
          );

          if (e.key === "ArrowDown") {
            if (row === -1) {
              focusHeaderCell(0, 0);
            } else if (isHeaderCell && row + 1 < headerRows) {
              focusHeaderCell(row + 1, col);
            } else {
              const nextRow = Math.max(from, isHeaderCell ? 0 : row + 1);
              const nextRowIdx = nextRow;
              if (nextRowIdx < fullRange.to) {
                if (nextRowIdx < Math.floor(to) && isInteger(nextRow)) {
                  focusCell(nextRow);
                  e.stopPropagation();
                  e.preventDefault();
                } else {
                  if (!isInteger(nextRow)) {
                    console.log(
                      "how do we tell viewport to scroll up to align row, not down ?"
                    );
                  }
                  requestAnimationFrame(() => {
                    focusCell(Math.floor(nextRow));
                  });
                }
              }
            }
          } else if (e.key === "ArrowUp") {
            if (isHeaderCell && row === 0) {
              // do nothing
            } else if (isHeaderCell) {
              focusHeaderCell(row - 1);
            } else if (!isHeaderCell && row === 0) {
              focusHeaderCell(headerRows - 1);
            } else {
              const nextRow = row - 1;
              if (nextRow >= fullRange.from) {
                if (nextRow >= from && isInteger(nextRow)) {
                  focusCell(nextRow);
                  e.stopPropagation();
                  e.preventDefault();
                } else {
                  requestAnimationFrame(() => {
                    focusCell(nextRow);
                  });
                }
              }
            }
          }
        } else if (isColNavKey(e.key)) {
          const focusNextCell = isHeaderCell ? focusHeaderCell : focusCell;
          e.stopPropagation();
          e.preventDefault();

          if (e.key === "ArrowRight" && col + 1 < gridModel.columns.length) {
            focusNextCell(row, col + 1);
          } else if (e.key === "ArrowLeft" && col > 0) {
            focusNextCell(row, col - 1);
          }
        } else if (e.key === "Enter") {
          console.log("enter pressed, is there a valid action ?");
        }
      }
    },
    [focusCell, focusHeaderCell, gridModel.columns, gridModel.renderBufferSize]
  );

  const handleClick = useCallback(
    (e) => {
      const cellEl = e.target.closest(".vuuDataGridCell, .hwHeaderCell");
      if (cellEl) {
        // what about row selection
        // somehow need to determine whether we're in 'row select'mode or edit mode
        // e.stopPropagation();
        const rowEl = cellEl.parentNode;
        const col = Array.from(rowEl.childNodes).indexOf(cellEl);
        const row = parseInt(rowEl.dataset.idx);
        focusCell(row, col);
      }
    },
    [focusCell]
  );

  const handleFocus = useCallback(() => {
    const {
      current: { hasFocus },
    } = focusState;
    if (!hasFocus) {
      focusState.current.hasFocus = true;
      // do this in a timeout, so we can cancel it if it turns out to have been a click
      focusHeaderCell(0, 0);
    }
  }, [focusHeaderCell]);

  const handleBlur = useCallback(
    (e) => {
      if (rootRef.current?.contains(e.relatedTarget)) {
        // do nothing
      } else {
        focusState.current.hasFocus = false;
      }
    },
    [rootRef]
  );

  useEffect(() => {
    const rootEl = rootRef.current;
    if (allowCellSelection) {
      rootEl?.addEventListener("blur", handleBlur, true);
      rootEl?.addEventListener("click", handleClick, true);
      rootEl?.addEventListener("keydown", handleKeyDown, true);
      rootEl?.addEventListener("focus", handleFocus, true);
    }

    return () => {
      if (allowCellSelection) {
        rootEl?.removeEventListener("blur", handleBlur, true);
        rootEl?.removeEventListener("click", handleClick, true);
        rootEl?.removeEventListener("focus", handleFocus, true);
        rootEl?.removeEventListener("keydown", handleKeyDown, true);
      }
    };
  }, [
    allowCellSelection,
    handleBlur,
    handleClick,
    handleFocus,
    handleKeyDown,
    rootRef,
  ]);

  return setRange;
};
