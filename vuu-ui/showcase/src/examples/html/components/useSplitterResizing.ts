import { MouseEventHandler, useCallback, useRef } from "react";
import { getRow, getRowIndex, getRows } from "./grid-dom-utils";
import { GridLayoutProps } from "./GridLayout";

export type SplitterResizingHookProps = Pick<
  GridLayoutProps,
  "rowCount" | "rows"
>;

type ResizeState = {
  grid?: HTMLElement;
  indexPositions: [number, number];
  mousePos: number;

  rows: number[];
  sizes: [number, number];
};

const initialState: ResizeState = {
  grid: undefined,
  indexPositions: [-1, -1],
  mousePos: -1,
  rows: [],
  sizes: [-1, -1],
};

export const useSplitterResizing = ({
  rowCount,
  rows = ["80px"].concat(Array(rowCount).fill("1fr")),
}: SplitterResizingHookProps) => {
  const resizingState = useRef<ResizeState>(initialState);

  const mouseMove = useCallback((e: MouseEvent) => {
    const {
      grid,
      indexPositions: [i1, i2],
      mousePos,
      rows,
      sizes: [h1, h2],
    } = resizingState.current;

    if (grid) {
      const newRows = rows.slice();
      const d = mousePos - e.clientY;
      newRows[i1] = h1 - d;
      newRows[i2] = h2 + d;
      grid.style.gridTemplateRows = newRows.map((r) => `${r}px`).join(" ");
    }
  }, []);

  const onMouseDown = useCallback<MouseEventHandler>(
    (e) => {
      const t2 = e.target as HTMLElement;
      const grid = t2.closest(".vuuGridLayout") as HTMLElement;
      const { height: h2, top } = t2.getBoundingClientRect();
      if (e.clientY < top) {
        const t1 = t2.previousElementSibling as HTMLElement;
        if (t1 && grid) {
          const { height: h1 } = t1.getBoundingClientRect();
          resizingState.current = {
            grid,
            indexPositions: [getRowIndex(t1), getRowIndex(t2)],
            mousePos: e.clientY,
            rows: getRows(grid),
            sizes: [h1, h2],
          };
          t2.classList.add("resizing");
          document.addEventListener("mousemove", mouseMove);
        }
      }
    },
    [mouseMove]
  );

  const onMouseUp = useCallback<MouseEventHandler>(
    (e) => {
      document.removeEventListener("mousemove", mouseMove);
      const target = e.target as HTMLElement;
      target.classList.remove("resizing");
    },
    [mouseMove]
  );

  return {
    gridTemplateRows: rows.join(" "),
    onMouseDown,
    onMouseUp,
  };
};
