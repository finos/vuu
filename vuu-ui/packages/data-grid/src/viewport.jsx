import React, {
  createRef,
  forwardRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
} from "react";
import { useContextMenu } from "@vuu-ui/ui-controls";
import { useEffectSkipFirst } from "@vuu-ui/react-utils";
import { metadataKeys } from "@vuu-ui/utils";
import useScroll from "./use-scroll";
import useUpdate from "./use-update";
import useDataSource from "./use-data-source";
import { getColumnGroupColumnIdx } from "./grid-model/grid-model-utils.js";

import Canvas from "./canvas";
import ColumnBearer from "./column-bearer";
import InsertIndicator from "./insert-indicator";

const DEFAULT_TOGGLE_STRATEGY = {};

const getToggleStrategy = (dataSource) => {
  const { features = {} } = dataSource;
  if (features.expand_level_1 === false) {
    return { expand_level_1: false };
  } else {
    return DEFAULT_TOGGLE_STRATEGY;
  }
};

// Temp, until we manage selection properly
const countSelectedRows = (data) => {
  let count = 0;
  for (let row of data) {
    if (row && row[metadataKeys.SELECTED]) {
      count += 1;
    }
  }
  return count;
};

/** @type {Viewport} */
const Viewport = forwardRef(function Viewport(
  {
    columnDragData,
    gridModel,
    onColumnDragStart,
    onColumnDrop,
    onConfigChange,
    onChangeRange,
    onRowClick,
  },
  ref
) {
  const viewportEl = useRef(null);
  const scrollingEl = useRef(null);
  /** @type {React.MutableRefObject<any>} */
  const canvasRefs = useRef([]);
  const columnBearer = useRef(null);
  const horizontalScrollbarHeight = useRef(gridModel.horizontalScrollbarHeight);
  const verticalScrollbarWidth = useRef(0);
  const firstVisibleRow = useRef(0);
  const insertIndicator = useRef(null);

  const { rowHeight, viewportHeight, viewportRowCount } = gridModel;

  useEffect(() => {
    horizontalScrollbarHeight.current = gridModel.horizontalScrollbarHeight;
  }, [gridModel.horizontalScrollbarHeight]);

  // TODO we could get gridModel here as well. Or would it be better to split gridModel into it's own context ?

  const getRoundedRange = useCallback(
    (from) => {
      const newFrom = Math.floor(from);
      const newTo = newFrom + Math.ceil(viewportRowCount);
      if (newFrom === parseInt(newFrom) && newTo < viewportRowCount) {
        return { from: newFrom, to: newTo + 1 };
      } else {
        return { from: newFrom, to: newTo };
      }
    },
    [viewportRowCount]
  );

  const gridModelRef = useRef(gridModel);
  if (gridModelRef.current !== gridModel) {
    // Is there a better way to do this - the dataSource effect needs to get the latest gridModel
    // but changes to gridModel should not trigger re-subscription
    gridModelRef.current = gridModel;
  }

  const showColumnBearer = useRef(columnDragData !== null);
  showColumnBearer.current = columnDragData !== null;

  const canvasCount = gridModel.columnGroups
    ? gridModel.columnGroups.length
    : 0;
  if (canvasRefs.current.length !== canvasCount) {
    // add or remove refs
    canvasRefs.current = Array(canvasCount)
      .fill(null)
      .map((_, i) => canvasRefs.current[i] || createRef());
  }
  const scrollableCanvasIdx = gridModel.columnGroups
    ? gridModel.columnGroups.findIndex((group) => !group.locked)
    : -1;

  const handleColumnBearerScroll = (scrollDistance) =>
    canvasRefs.current[scrollableCanvasIdx].current.scrollBy(scrollDistance);

  const handleColumnDrag = useCallback(
    async (dragPhase, draggedColumn, insertIdx, insertPos, columnLeft) => {
      const { columnGroupIdx, columnIdx } = columnDragData;
      const { current: canvas } = canvasRefs.current[columnGroupIdx];
      if (dragPhase === "drag") {
        // only called when we cross onto next targetColumn
        insertIndicator.current.style.left = insertPos + "px";
      } else if (dragPhase === "drag-end") {
        insertIndicator.current.style.transition = "left ease .3s";
        if (canvas.isWithinScrollWindow(draggedColumn)) {
          if (insertIdx > columnIdx) {
            insertIndicator.current.style.left =
              insertPos - draggedColumn.width + "px";
            columnBearer.current.setFinalPosition(
              insertPos - draggedColumn.width
            );
          } else {
            insertIndicator.current.style.left = insertPos + "px";
            columnBearer.current.setFinalPosition(insertPos);
          }
        }
        const groupInsertIdx = getColumnGroupColumnIdx(gridModel, insertIdx);
        await canvas.endDrag(columnDragData, groupInsertIdx, columnLeft);
        onColumnDrop(dragPhase, draggedColumn, insertIdx);
      }
    },
    [gridModel, onColumnDrop, columnDragData]
  );

  // we should not take columnNames from gridModel - they will not yet have been recomputed if
  // dataSource has changed
  const { columnNames, sort } = gridModelRef.current;
  const subscriptionDetails = useRef({
    columnNames,
    range: getRoundedRange(0),
    sort,
  });

  const handleSizeChange = useCallback(
    (newSize) => {
      // How do we handle this withoput having this dependency on gridModel ?
      // This is the important one, it comes with every rowSet
      if (
        newSize >= Math.ceil(viewportRowCount) &&
        verticalScrollbarWidth.current === 0
      ) {
        verticalScrollbarWidth.current = 15;
      } else if (
        newSize < Math.ceil(viewportRowCount) &&
        verticalScrollbarWidth.current === 15
      ) {
        verticalScrollbarWidth.current = 0;
      }
    },
    [viewportRowCount]
  );

  const [data, _setRange, dataSource] = useDataSource(
    subscriptionDetails.current,
    gridModel,
    onConfigChange,
    handleSizeChange
  );

  const { rowCount } = dataSource;

  const previousRange = useRef({ from: 0, to: 0 });
  const setRange = useCallback(
    (from, to) => {
      const { from: newFrom, to: newTo } = getRoundedRange(from);
      const {
        current: { from: previousFrom, to: previousTo },
      } = previousRange;
      if (newFrom !== previousFrom || newTo !== previousTo) {
        _setRange(newFrom, newTo);
        onChangeRange && onChangeRange({ from, to });
        previousRange.current.from = newFrom;
        previousRange.current.to = newTo;
      }
    },
    [getRoundedRange, _setRange, onChangeRange]
  );

  useUpdate(() => {
    setRange(
      firstVisibleRow.current,
      firstVisibleRow.current + viewportRowCount
    );
  }, [viewportRowCount]);

  const scrollCallback = useCallback(
    (scrollEvent, scrollTop) => {
      if (scrollEvent === "scroll") {
        const firstRow = scrollTop / rowHeight;
        if (firstRow !== firstVisibleRow.current) {
          firstVisibleRow.current = firstRow;
          const lastRow = firstRow + viewportRowCount;

          // const lastRow = firstRow + Math.ceil(gridModel.viewportRowCount);
          if (lastRow > rowCount) {
            setRange(rowCount - viewportRowCount, rowCount);
          } else {
            setRange(firstRow, firstRow + viewportRowCount);
          }
        }
      } else if (scrollEvent === "scroll-start") {
        canvasRefs.current.forEach(({ current }) =>
          current.beginVerticalScroll()
        );
      } else {
        canvasRefs.current.forEach(({ current }) =>
          current.endVerticalScroll(scrollTop)
        );
      }
    },
    [rowHeight, viewportRowCount, rowCount, setRange]
  );

  useEffectSkipFirst(() => {
    viewportEl.current.scrollTop = 0;
  }, [dataSource]);

  useLayoutEffect(() => {
    if (columnDragData) {
      const { column, columnGroupIdx } = columnDragData;
      const columnOffset =
        canvasRefs.current[columnGroupIdx].current.beginDrag(column);
      const { left } = viewportEl.current.getBoundingClientRect();
      insertIndicator.current.style.left = columnOffset - left + "px";
    }
  }, [columnDragData]);

  const [handleVerticalScroll, suspendScrollHandling] = useScroll(
    "scrollTop",
    scrollCallback
  );

  const toggleStrategy = useMemo(
    () => getToggleStrategy(dataSource),
    [dataSource]
  );

  const contextMenuOptions = useMemo(() => {
    return {
      selectedRowCount: countSelectedRows(data),
      viewport: dataSource.viewport,
    };
  }, [data, dataSource]);

  const showContextMenu = useContextMenu();
  const handleContextMenu = (e) => {
    showContextMenu(e, "grid", contextMenuOptions);
  };

  useImperativeHandle(ref, () => ({
    beginHorizontalScroll: () => {
      if (!showColumnBearer.current) {
        const header =
          gridModel.headerHeight * gridModel.headingDepth +
          gridModel.customInlineHeaderHeight;
        scrollingEl.current.style.height = `${
          header +
          Math.max(
            rowCount * rowHeight + horizontalScrollbarHeight.current,
            gridModel.viewportHeight
          )
        }px`;
        canvasRefs.current.forEach(({ current }) =>
          current.beginHorizontalScroll()
        );
      }
    },
    endHorizontalScroll: () => {
      if (!showColumnBearer.current) {
        canvasRefs.current.forEach(({ current }) =>
          current.endHorizontalScroll()
        );
        scrollingEl.current.style.height = `${Math.max(
          rowCount * rowHeight + horizontalScrollbarHeight.current,
          gridModel.viewportHeight
        )}px`;
        return canvasRefs.current[scrollableCanvasIdx].current.scrollLeft;
      }
    },
  }));

  const scrollBy = useCallback(
    (rows) => {
      const { scrollTop } = viewportEl.current;
      const scrollAmt =
        rows === 1
          ? rowHeight - ((viewportHeight + scrollTop) % rowHeight) || rowHeight
          : rows === -1
          ? -(scrollTop % rowHeight) || -rowHeight
          : scrollTop + rows * rowHeight - (scrollTop % rowHeight);
      viewportEl.current.scrollTop = scrollTop + scrollAmt;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [rowHeight, viewportHeight]
  );

  const scrollEnd = useCallback(
    (startOrEnd) => {
      suspendScrollHandling(true);

      const scrollPos =
        startOrEnd === "start" ? 0 : rowCount * rowHeight - viewportHeight;
      viewportEl.current.scrollTop = scrollPos;
      suspendScrollHandling(false);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [rowCount, rowHeight, viewportHeight, suspendScrollHandling]
  );

  const handleKeyDown = useCallback(
    (evt) => {
      switch (evt.key) {
        case "ArrowDown":
          evt.preventDefault();
          scrollBy(1);
          break;
        case "ArrowUp":
          evt.preventDefault();
          scrollBy(-1);
          break;
        case "Home":
          evt.preventDefault();
          scrollEnd("start");
          break;
        case "End":
          evt.preventDefault();
          scrollEnd("end");
          break;
        default:
      }
    },
    [scrollBy, scrollEnd]
  );

  // Rowcount is only available after first data response is received from dataSource
  const contentRowCount = rowCount ?? Math.floor(gridModel.viewportRowCount);

  return (
    <>
      <div
        className="Viewport"
        ref={viewportEl}
        style={{ height: gridModel.viewportHeight }}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        onScroll={handleVerticalScroll}
        tabIndex={-1}
      >
        <div
          className="scrollingCanvasContainer"
          ref={scrollingEl}
          style={{
            height: Math.max(
              rowHeight * contentRowCount + horizontalScrollbarHeight.current,
              gridModel.viewportHeight
            ),
          }}
        >
          {gridModel.columnGroups
            ? gridModel.columnGroups.map((columnGroup, idx) => (
                <Canvas
                  columnGroupIdx={idx}
                  contentHeight={rowHeight * contentRowCount}
                  firstVisibleRow={firstVisibleRow.current}
                  gridModel={gridModel}
                  height={gridModel.viewportHeight}
                  horizontalScrollbarHeight={horizontalScrollbarHeight.current}
                  key={idx}
                  onColumnDragStart={onColumnDragStart}
                  onRowClick={onRowClick}
                  ref={canvasRefs.current[idx]}
                  data={data}
                  toggleStrategy={toggleStrategy} // brand new, not well thought out yet
                />
              ))
            : null}
        </div>
      </div>
      {columnDragData && (
        <>
          <InsertIndicator ref={insertIndicator} />
          <ColumnBearer
            columnDragData={columnDragData}
            gridModel={gridModel}
            initialScrollPosition={
              canvasRefs.current[scrollableCanvasIdx].current.scrollLeft
            }
            onDrag={handleColumnDrag}
            onScroll={handleColumnBearerScroll}
            ref={columnBearer}
            rows={data}
          />
        </>
      )}
    </>
  );
});

export default Viewport;
