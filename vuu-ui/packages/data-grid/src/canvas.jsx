import React, {
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useMemo,
  useReducer,
  useRef,
} from "react";
import cx from "classnames";
import { metadataKeys } from "@vuu-ui/utils";
import GridContext from "./grid-context";
import ColumnGroupHeader from "./column-group-header";
import useScroll from "./use-scroll";
import useUpdate from "./use-update";
import canvasReducer, { initCanvasReducer } from "./canvas-reducer";
import Row from "./grid-row";
import { getColumnOffset } from "./grid-model/grid-model-utils";

const { IDX, RENDER_IDX, count: metadataCount } = metadataKeys;
// const byKey = (row1, row2) => row1[RENDER_IDX] - row2[RENDER_IDX];

const classBase = "hwDataGridCanvas";

/** @type {Canvas} */
const Canvas = forwardRef(function Canvas(
  {
    columnGroupIdx,
    contentHeight,
    gridModel,
    height,
    horizontalScrollbarHeight,
    onColumnDragStart,
    onRowClick,
    data: rows,
    toggleStrategy,
  },
  ref
) {
  const canvasEl = useRef(null);
  const contentEl = useRef(null);
  const columnGroupHeader = useRef(null);
  const { dispatchGridAction } = useContext(GridContext);
  const columnGroup = gridModel.columnGroups[columnGroupIdx];
  const scrollbarHeightAdjustment = columnGroup.locked
    ? horizontalScrollbarHeight
    : 0;

  const [[columns, cellKeys], dispatchCanvasAction] = useReducer(
    canvasReducer,
    columnGroup,
    initCanvasReducer
  );

  const columnMap = useMemo(() => {
    return gridModel.columnNames.reduce((map, columnName, idx) => {
      map[columnName] = metadataCount + idx;
      return map;
    }, {});
  }, [gridModel.columnNames]);

  useUpdate(() => {
    dispatchCanvasAction({ type: "refresh", columnGroup });
  }, [columnGroup.width, columnGroup.columns]);

  const getColumnIdx = (column) =>
    columns.findIndex((col) => col.key === column.key);

  useImperativeHandle(ref, () => ({
    beginHorizontalScroll: () => {
      const canvasHeight = columnGroup.locked
        ? gridModel.height - horizontalScrollbarHeight
        : gridModel.height;
      canvasEl.current.style.height = `${
        canvasHeight -
        gridModel.customHeaderHeight -
        gridModel.customFooterHeight
      }px`;
    },
    endHorizontalScroll: () => {
      const canvasHeight = columnGroup.locked
        ? height - horizontalScrollbarHeight
        : height;
      canvasEl.current.style.height = `${canvasHeight}px`;
    },
    beginVerticalScroll: () => {
      canvasEl.current.style.marginTop = "0px";
      canvasEl.current.style.height = `${
        contentHeight + horizontalScrollbarHeight
      }px`;
      contentEl.current.style.transform = "translate3d(0px, 0px, 0px)";
    },

    endVerticalScroll: (scrollTop) => {
      canvasEl.current.style.marginTop = scrollTop + "px";
      canvasEl.current.style.height = `${height - scrollbarHeightAdjustment}px`;
      contentEl.current.style.transform = `translate3d(0px, -${scrollTop}px, 0px)`;
    },

    beginDrag: (column) => {
      const idx = columns.findIndex((col) => col.key === column.key);
      const rows = contentEl.current.childNodes;
      const headerCells = getHeaderCells(canvasEl);
      const effect = { addClass: { idx } };
      applyOperation(effect, [headerCells], column.width);
      applyOperation(effect, rows, column.width);

      const { left } = headerCells[idx].getBoundingClientRect();
      return left;
    },

    endDrag: (columnDragData, insertIdx, columnLeft) => {
      const { column } = columnDragData;
      const idx = getColumnIdx(column);
      const rows = contentEl.current.childNodes;
      const headerCells = getHeaderCells(canvasEl);
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
          scrollLeft -= column.width;
        }
        canvasEl.current.scrollLeft = scrollLeft;
      } else {
        // We only need this if the original column position is still inside the scroll window
        const effect = {
          replaceClass: {
            idx,
            className: "DraggedColumn",
            newClassName: "Vanishing",
          },
          openSpaceLeft: { idx: insertIdx },
        };
        applyOperation(effect, [headerCells], column.width);
        applyOperation(effect, rows, column.width);
        return new Promise((resolve) => {
          headerCells[idx].addEventListener("transitionend", () => {
            const effect = {
              removeClass: { idx, className: "Vanishing" },
              closeSpaceLeft: { idx: -insertIdx },
            };
            applyOperation(effect, [headerCells]);
            applyOperation(effect, rows);
            resolve();
          });
        });
      }
    },

    isWithinScrollWindow: (column) => getColumnIdx(column) !== -1,

    scrollBy: (scrollDistance) => scrollBy(scrollDistance),

    get scrollLeft() {
      return canvasEl.current.scrollLeft;
    },
  }));

  // TODO memoize
  function applyOperation(ops, rows, width) {
    Object.entries(ops).forEach(([opName, args]) => {
      const suppressTransition = args.idx < 0;
      const idx = Math.abs(args.idx);
      for (let i = 0; i < rows.length; i++) {
        const cells = Array.isArray(rows[i]) ? rows[i] : rows[i].childNodes;
        if (idx !== -1 && idx < cells.length) {
          switch (opName) {
            case "openSpaceLeft":
              openSpaceLeft(cells[idx], width, suppressTransition);
              break;
            case "closeSpaceLeft":
              closeSpaceLeft(cells[idx], suppressTransition);
              break;
            case "openSpaceRight":
              openSpaceRight(cells[idx], width);
              break;
            case "closeSpaceRight":
              closeSpaceRight(cells[idx], suppressTransition);
              break;
            case "hide":
              cells[idx].style.display = "none";
              break;
            case "addClass":
              cells[idx].classList.add("DraggedColumn");
              break;
            case "removeClass":
              cells[idx].classList.remove(args.className);
              break;
            case "replaceClass":
              cells[idx].classList.replace(args.className, args.newClassName);
              break;
            default:
          }
        }
      }
    });
  }

  const scrollBy = useCallback(
    (scrollDistance) => {
      let scrollLeft = canvasEl.current.scrollLeft;
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
    },
    [canvasEl]
  );

  const { contentWidth, width } = columnGroup;

  const horizontalScrollHandler = useCallback(
    (scrollEvent, scrollLeft) => {
      if (scrollEvent === "scroll") {
        dispatchCanvasAction({ type: "scroll-left", scrollLeft });
      } else if (scrollEvent === "scroll-start") {
        dispatchGridAction({ type: "scroll-start-horizontal", scrollLeft });
        columnGroupHeader.current.beginHorizontalScroll(
          columnGroup.contentWidth
        );
      } else {
        canvasEl.current.style.height = `${
          height - scrollbarHeightAdjustment
        }px`;
        columnGroupHeader.current.endHorizontalScroll(
          scrollLeft,
          columnGroup.width
        );
        dispatchGridAction({ type: "scroll-end-horizontal", scrollLeft });
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

      dispatchGridAction({
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
        {/* {rows.sort(byKey).map((row) => ( */}
        {rows.map((row) => (
          <Row
            key={row[RENDER_IDX]}
            columnMap={columnMap}
            columns={columns}
            height={gridModel.rowHeight}
            idx={row[IDX]}
            keys={cellKeys}
            onClick={handleRowClick}
            row={row}
            toggleStrategy={toggleStrategy}
          />
        ))}
      </div>
    </div>
  );
});

export default Canvas;

const getHeaderCells = (canvasEl) =>
  Array.from(canvasEl.current.querySelectorAll("[role='columnheader']"));

const closeSpaceLeft = (el, suppressTransition) => {
  el.style.marginLeft = "0px";
  if (suppressTransition === true) {
    el.style.transition = null;
  } else {
    el.style.transition = "margin .15s ease-in-out";
  }
};

const closeSpaceRight = (el, suppressTransition) => {
  el.style.marginRight = "0px";
  el.style.width = parseInt(el.style.width) - 1 + "px";
  el.style.borderRight = "none";
  if (suppressTransition === true) {
    el.style.transition = null;
  } else {
    el.style.transition = "margin .15s ease-in-out";
  }
};

const openSpaceLeft = (el, size, suppressTransition) => {
  el.style.marginLeft = size - 1 + "px";
  if (suppressTransition !== true) {
    el.style.transition = "margin .3s ease";
  }
};

const openSpaceRight = (el, size, suppressTransition) => {
  el.style.marginRight = size - 1 + "px";
  el.style.width = parseInt(el.style.width) + 1 + "px";
  el.style.borderRight = "solid 1px #ccc";
  if (suppressTransition !== true) {
    el.style.transition = "margin .15s ease-in-out";
  }
};
