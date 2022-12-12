import React, {
  ForwardedRef,
  forwardRef,
  MutableRefObject,
  useCallback,
  useImperativeHandle,
  useMemo,
  useReducer,
  useRef,
} from "react";
import cx from "classnames";
import { buildColumnMap, DataRow, metadataKeys } from "@vuu-ui/vuu-utils";
import { useGridContext } from "../grid-context";
import ColumnGroupHeader, { ColumnGroupHeaderAPI } from "../ColumnGroupHeader";
import useScroll from "../use-scroll";
import useUpdate from "../use-update";
import {
  CanvasReducer,
  canvasReducer,
  initCanvasReducer,
} from "./canvas-reducer";
import Row from "../grid-row";
import { getColumnOffset } from "../grid-model/gridModelUtils";
import {
  ColumnDragStartHandler,
  ColumnDragState,
  RowClickHandler,
} from "../gridTypes";
import {
  ColumnGroupType,
  GridModelType,
  KeyedColumnDescriptor,
} from "../grid-model/gridModelTypes";

const { IDX, RENDER_IDX, SELECTED } = metadataKeys;

const classBase = "vuuDataGridCanvas";

interface EffectWithIdx {
  idx: number;
}
interface AddClassEffect extends EffectWithIdx {
  type: "addClass";
}
interface AddClassEffect extends EffectWithIdx {
  type: "addClass";
}
interface CloseSpaceLeftEffect extends EffectWithIdx {
  type: "closeSpaceLeft";
}
interface OpenSpaceLeftEffect extends EffectWithIdx {
  type: "openSpaceLeft";
}
interface RemoveClassEffect extends EffectWithIdx {
  type: "removeClass";
  className: string;
}
interface ReplaceClassEffect extends EffectWithIdx {
  type: "replaceClass";
  className: string;
  newClassName: string;
}

type Effect =
  | AddClassEffect
  | CloseSpaceLeftEffect
  | OpenSpaceLeftEffect
  | RemoveClassEffect
  | ReplaceClassEffect;

export interface CanvasProps {
  columnGroupIdx: number;
  contentHeight: number;
  firstVisibleRow: number;
  gridModel: GridModelType;
  height: number;
  horizontalScrollbarHeight: number;
  onColumnDragStart?: ColumnDragStartHandler;
  ref?: MutableRefObject<HTMLDivElement>;
  data: DataRow[];
  onRowClick?: RowClickHandler;
}

export interface CanvasAPI {
  beginDrag: (column: KeyedColumnDescriptor) => number | undefined;
  beginHorizontalScroll: () => void;
  beginVerticalScroll: () => void;
  endDrag: (
    columnDragData: ColumnDragState,
    insertIdx: number,
    columnLeft: number
  ) => void;
  endHorizontalScroll: () => void;
  isWithinScrollWindow: (column: KeyedColumnDescriptor) => boolean;
  endVerticalScroll: (scrollTol: number) => void;
  scrollBy: (distance: number) => number;
  scrollLeft: number;
}

export const Canvas = forwardRef(function Canvas(
  {
    columnGroupIdx,
    contentHeight,
    gridModel,
    height,
    horizontalScrollbarHeight,
    onColumnDragStart,
    onRowClick,
    data: rows,
  }: CanvasProps,
  forwardedRef: ForwardedRef<CanvasAPI>
) {
  const canvasEl = useRef<HTMLDivElement>(null);
  const contentEl = useRef<HTMLDivElement>(null);
  const columnGroupHeader = useRef<ColumnGroupHeaderAPI>(null);
  const { dispatchGridAction } = useGridContext();
  const columnGroup = gridModel.columnGroups?.[
    columnGroupIdx
  ] as ColumnGroupType;
  const scrollbarHeightAdjustment = columnGroup.locked
    ? horizontalScrollbarHeight
    : 0;

  const [[columns], dispatchCanvasAction] = useReducer<
    CanvasReducer,
    ColumnGroupType
  >(canvasReducer, columnGroup, initCanvasReducer);

  const columnMap = useMemo(
    () => buildColumnMap(gridModel.columnNames),
    [gridModel.columnNames]
  );

  useUpdate(() => {
    dispatchCanvasAction({ type: "refresh", columnGroup });
  }, [columnGroup.width, columnGroup.columns]);

  const getColumnIdx = (column: KeyedColumnDescriptor) =>
    columns.findIndex((col) => col.key === column.key);

  useImperativeHandle(forwardedRef, () => ({
    beginHorizontalScroll: () => {
      if (canvasEl.current && gridModel.height) {
        const canvasHeight = columnGroup.locked
          ? gridModel.height - horizontalScrollbarHeight
          : gridModel.height;
        canvasEl.current.style.height = `${
          canvasHeight -
          gridModel.customHeaderHeight -
          gridModel.customFooterHeight
        }px`;
      }
    },
    endHorizontalScroll: () => {
      if (canvasEl.current) {
        const canvasHeight = columnGroup.locked
          ? height - horizontalScrollbarHeight
          : height;
        canvasEl.current.style.height = `${canvasHeight}px`;
      }
    },
    beginVerticalScroll: () => {
      if (canvasEl.current && contentEl.current) {
        canvasEl.current.style.marginTop = "0px";
        canvasEl.current.style.height = `${
          contentHeight + horizontalScrollbarHeight
        }px`;
        contentEl.current.style.transform = "translate3d(0px, 0px, 0px)";
      }
    },

    endVerticalScroll: (scrollTop) => {
      if (canvasEl.current && contentEl.current) {
        canvasEl.current.style.marginTop = scrollTop + "px";
        canvasEl.current.style.height = `${
          height - scrollbarHeightAdjustment
        }px`;
        contentEl.current.style.transform = `translate3d(0px, -${scrollTop}px, 0px)`;
      }
    },

    beginDrag: (column) => {
      if (canvasEl.current && contentEl.current) {
        const idx = columns.findIndex((col) => col.key === column.key);
        const rows = Array.from(contentEl.current.childNodes) as HTMLElement[];
        const headerCells = getHeaderCells(canvasEl.current);
        const effect: Effect = { type: "addClass", idx };
        applyOperationToHeaderCells([effect], headerCells, column.width);
        applyOperationToRows([effect], rows, column.width);
        const { left } = headerCells[idx].getBoundingClientRect();
        return left;
      }
    },

    endDrag: (
      columnDragData,
      insertIdx,
      columnLeft
    ): Promise<void> | undefined => {
      if (canvasEl.current && contentEl.current) {
        const { column } = columnDragData;
        const idx = getColumnIdx(column);
        const rows = Array.from(contentEl.current.childNodes) as HTMLElement[];
        const headerCells = getHeaderCells(canvasEl.current);
        if (idx === -1) {
          // we're going to reposition the scrolling canvas, such that the inserted column ends up
          // exactly where we drop it
          let scrollLeft = canvasEl.current.scrollLeft;
          // get the onscreen offset (relative to grid) of the insertion point
          const insertionPointLeft =
            getColumnOffset(gridModel, columnGroupIdx, insertIdx) - scrollLeft;
          // recompute scrollLeft to line up the insertion point with left edge of dragged column.
          scrollLeft += insertionPointLeft - columnLeft;
          if (columnDragData.columnIdx < insertIdx) {
            // if column was originally offscreen to the left, we can remove it's width from the scrollLeft
            scrollLeft -= column.width ?? 0;
          }
          canvasEl.current.scrollLeft = scrollLeft;
        } else {
          // We only need this if the original column position is still inside the scroll window
          const effects: Effect[] = [
            {
              type: "replaceClass",
              idx,
              className: "DraggedColumn",
              newClassName: "Vanishing",
            },
            { type: "openSpaceLeft", idx: insertIdx },
          ];
          applyOperationToHeaderCells(effects, headerCells, column.width);
          applyOperationToRows(effects, rows, column.width);
          return new Promise((resolve) => {
            headerCells[idx].addEventListener("transitionend", () => {
              const effects: Effect[] = [
                {
                  type: "removeClass",
                  idx,
                  className: "Vanishing",
                },
                { type: "closeSpaceLeft", idx: -insertIdx },
              ];
              applyOperationToHeaderCells(effects, headerCells);
              applyOperationToRows(effects, rows);
              resolve();
            });
          });
        }
      }
    },

    isWithinScrollWindow: (column: KeyedColumnDescriptor) =>
      getColumnIdx(column) !== -1,

    scrollBy: (scrollDistance: number) => scrollBy(scrollDistance),

    get scrollLeft() {
      return canvasEl.current?.scrollLeft ?? 0;
    },
  }));

  // TODO memoize
  function applyOperationToHeaderCells(
    effects: Effect[],
    headerCells: HTMLElement[],
    width = 0
  ) {
    effects.forEach((effect) => {
      const suppressTransition = effect.idx < 0;
      const idx = Math.abs(effect.idx);
      for (let i = 0; i < headerCells.length; i++) {
        if (idx !== -1 && idx < headerCells.length) {
          switch (effect.type) {
            case "openSpaceLeft":
              openSpaceLeft(headerCells[idx], width, suppressTransition);
              break;
            case "closeSpaceLeft":
              closeSpaceLeft(headerCells[idx], suppressTransition);
              break;
            case "addClass":
              headerCells[idx].classList.add("DraggedColumn");
              break;
            case "removeClass":
              headerCells[idx].classList.remove(effect.className);
              break;
            case "replaceClass":
              headerCells[idx].classList.replace(
                effect.className,
                effect.newClassName
              );
              break;
            default:
          }
        }
      }
    });
  }
  function applyOperationToRows(
    effects: Effect[],
    rows: HTMLElement[],
    width = 0
  ) {
    effects.forEach((effect) => {
      const suppressTransition = effect.idx < 0;
      const idx = Math.abs(effect.idx);
      for (let i = 0; i < rows.length; i++) {
        const cells = Array.from(rows[i].childNodes) as HTMLElement[];
        if (idx !== -1 && idx < cells.length) {
          switch (effect.type) {
            case "openSpaceLeft":
              openSpaceLeft(cells[idx], width, suppressTransition);
              break;
            case "closeSpaceLeft":
              closeSpaceLeft(cells[idx], suppressTransition);
              break;
            case "addClass":
              cells[idx].classList.add("DraggedColumn");
              break;
            case "removeClass":
              cells[idx].classList.remove(effect.className);
              break;
            case "replaceClass":
              cells[idx].classList.replace(
                effect.className,
                effect.newClassName
              );
              break;
            default:
          }
        }
      }
    });
  }

  const scrollBy = useCallback(
    (scrollDistance: number): number => {
      if (canvasEl.current) {
        const scrollLeft = canvasEl.current.scrollLeft;
        let newScrollLeft = 0;

        if (scrollDistance < 0) {
          if (scrollLeft === 0) {
            return 0;
          } else {
            newScrollLeft = Math.max(0, scrollLeft + scrollDistance);
          }
        } else {
          // need to read this once, at start
          const maxScroll =
            canvasEl.current.scrollWidth - canvasEl.current.clientWidth;
          if (scrollLeft === maxScroll) {
            return 0;
          } else {
            newScrollLeft = Math.min(maxScroll, scrollLeft + scrollDistance);
          }
        }
        canvasEl.current.scrollLeft = newScrollLeft;
        // return the distance actually scrolled
        return newScrollLeft - scrollLeft;
      } else {
        return 0;
      }
    },
    [canvasEl]
  );

  const { contentWidth, width } = columnGroup;

  const horizontalScrollHandler = useCallback(
    (scrollEvent, scrollLeft) => {
      if (scrollEvent === "scroll") {
        dispatchCanvasAction({ type: "scroll-left", scrollLeft });
      } else if (scrollEvent === "scroll-start" && columnGroupHeader.current) {
        dispatchGridAction?.({ type: "scroll-start-horizontal", scrollLeft });
        columnGroupHeader.current.beginHorizontalScroll(
          columnGroup.contentWidth
        );
      } else if (canvasEl.current && columnGroupHeader.current) {
        canvasEl.current.style.height = `${
          height - scrollbarHeightAdjustment
        }px`;
        columnGroupHeader.current.endHorizontalScroll(
          scrollLeft,
          columnGroup.width
        );
        dispatchGridAction?.({ type: "scroll-end-horizontal", scrollLeft });
      }
    },
    [
      columnGroup.contentWidth,
      columnGroup.width,
      dispatchCanvasAction,
      dispatchGridAction,
      height,
      scrollbarHeightAdjustment,
    ]
  );

  const handleRowClick = useCallback(
    (idx, row, rangeSelect, keepExistingSelection) => {
      // This poses an interesting question. If selection is server side
      // at what point can we fire a selectionChange event - we have to do that clientSide -
      // need to watch for the selectionACK
      if (onRowClick) {
        onRowClick(row);
      }

      dispatchGridAction?.({
        type: "selection",
        idx,
        row,
        rangeSelect,
        keepExistingSelection,
      });
    },
    [dispatchGridAction, onRowClick]
  );

  const [onHorizontalScroll] = useScroll(
    "scrollLeft",
    horizontalScrollHandler,
    5
  );

  const rootClassName = cx(classBase, {
    "Canvas-fixed": columnGroup.locked,
    "Canvas-scrollable": !columnGroup.locked,
  });

  const canvasHeight = columnGroup.locked
    ? height - horizontalScrollbarHeight
    : height;

  return (
    <div
      className={rootClassName}
      ref={canvasEl}
      style={{ height: canvasHeight, width }}
      onScroll={onHorizontalScroll}
    >
      {/* Dont need to render header if noColumnHeaders specified */}
      <ColumnGroupHeader
        columnGroup={columnGroup}
        columnGroupIdx={columnGroupIdx}
        onColumnDragStart={onColumnDragStart}
        ref={columnGroupHeader}
      />

      <div
        className={`${classBase}-canvasContent`}
        ref={contentEl}
        style={{
          width: contentWidth,
          height: Math.max(contentHeight + horizontalScrollbarHeight, height),
        }}
      >
        {rows.map((row, i) => {
          if (row[SELECTED] === 1 && rows[i + 1]?.[SELECTED] === 0) {
            row = row.slice() as DataRow;
            row[SELECTED] = 2;
          }
          return (
            <Row
              key={row[RENDER_IDX]}
              columnMap={columnMap}
              columns={columns}
              height={gridModel.rowHeight}
              idx={row[IDX]}
              onClick={handleRowClick}
              row={row}
            />
          );
        })}
      </div>
    </div>
  );
});

const getHeaderCells = (canvasEl: HTMLElement): HTMLElement[] =>
  Array.from(canvasEl.querySelectorAll("[role='columnheader']"));

const closeSpaceLeft = (el: HTMLElement, suppressTransition: boolean) => {
  el.style.marginLeft = "0px";
  if (suppressTransition === true) {
    el.style.transition = "";
  } else {
    el.style.transition = "margin .15s ease-in-out";
  }
};

const openSpaceLeft = (
  el: HTMLElement,
  size: number,
  suppressTransition: boolean
) => {
  el.style.marginLeft = size - 1 + "px";
  if (suppressTransition !== true) {
    el.style.transition = "margin .3s ease";
  }
};
