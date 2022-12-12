import {
  createRef,
  forwardRef,
  MouseEvent,
  RefObject,
  useCallback,
  useImperativeHandle,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  ForwardedRef,
} from "react";
import { useContextMenu } from "@vuu-ui/ui-controls";
import { useEffectSkipFirst } from "./utils";
import { metadataKeys } from "@vuu-ui/vuu-utils";
import useScroll from "./use-scroll";
import useUpdate from "./use-update";
import { SubscriptionDetails, useDataSource } from "./grid-hooks";
import { getColumnGroupColumnIdx } from "./grid-model/gridModelUtils.js";

import { Canvas, CanvasAPI } from "./canvas";
import { ColumnBearer, ColumnBearerAPI } from "./ColumnBearer";
import InsertIndicator from "./InsertIndicator";
import { ViewportProps } from "./gridTypes";
import { DataSourceRow } from "@vuu-ui/vuu-data";

// Temp, until we manage selection properly
const countSelectedRows = (data: DataSourceRow[]) => {
  let count = 0;
  for (const row of data) {
    if (row && row[metadataKeys.SELECTED]) {
      count += 1;
    }
  }
  return count;
};

export interface ViewportScrollApi {
  beginHorizontalScroll: () => void;
  endHorizontalScroll: () => void;
}

export const Viewport = forwardRef(function Viewport(
  {
    columnDragData,
    gridModel,
    onColumnDragStart,
    onColumnDrop,
    onConfigChange,
    onChangeRange,
    onRowClick,
  }: ViewportProps,
  forwardedRef: ForwardedRef<ViewportScrollApi>
) {
  const viewportEl = useRef<HTMLDivElement>(null);
  const scrollingEl = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<RefObject<CanvasAPI>[]>([]);
  const columnBearer = useRef<ColumnBearerAPI>(null);
  const horizontalScrollbarHeight = useRef(gridModel.horizontalScrollbarHeight);
  const verticalScrollbarWidth = useRef(0);
  const firstVisibleRow = useRef(0);
  const insertIndicatorRef = useRef<HTMLDivElement>(null);

  const { rowHeight, viewportHeight, viewportRowCount } = gridModel;

  useEffect(() => {
    horizontalScrollbarHeight.current = gridModel.horizontalScrollbarHeight;
  }, [gridModel.horizontalScrollbarHeight]);

  // TODO we could get gridModel here as well. Or would it be better to split gridModel into it's own context ?

  const getRoundedRange = useCallback(
    (from: number) => {
      const newFrom = Math.floor(from);
      const newTo = newFrom + Math.ceil(viewportRowCount);
      if (newFrom === newFrom && newTo < viewportRowCount) {
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

  const handleColumnBearerScroll = (scrollDistance: number): number => {
    const canvas = canvasRefs.current[scrollableCanvasIdx].current;
    return canvas ? canvas.scrollBy(scrollDistance) : 0;
  };

  const handleColumnDrag = useCallback(
    async (dragPhase, draggedColumn, insertIdx, insertPos, columnLeft) => {
      if (
        columnDragData &&
        insertIndicatorRef.current &&
        columnBearer.current
      ) {
        const { columnGroupIdx, columnIdx } = columnDragData;
        const { current: canvas } = canvasRefs.current[columnGroupIdx];
        if (dragPhase === "drag") {
          // only called when we cross onto next targetColumn
          insertIndicatorRef.current.style.left = insertPos + "px";
        } else if (dragPhase === "drag-end" && canvas && columnBearer.current) {
          insertIndicatorRef.current.style.transition = "left ease .3s";
          if (canvas.isWithinScrollWindow(draggedColumn)) {
            if (insertIdx > columnIdx) {
              insertIndicatorRef.current.style.left =
                insertPos - draggedColumn.width + "px";
              columnBearer.current.setFinalPosition(
                insertPos - draggedColumn.width
              );
            } else {
              insertIndicatorRef.current.style.left = insertPos + "px";
              columnBearer.current.setFinalPosition(insertPos);
            }
          }
          const groupInsertIdx = getColumnGroupColumnIdx(gridModel, insertIdx);
          await canvas.endDrag(columnDragData, groupInsertIdx, columnLeft);
          onColumnDrop?.(dragPhase, draggedColumn, insertIdx);
        }
      }
    },
    [gridModel, onColumnDrop, columnDragData]
  );

  // we should not take columnNames from gridModel - they will not yet have been recomputed if
  // dataSource has changed
  const { columnNames, sort } = gridModelRef.current;
  const subscriptionDetails = useRef<SubscriptionDetails>({
    columnNames,
    range: getRoundedRange(0),
    sort: sort?.sortDefs,
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

  const {
    data,
    setRange: _setRange,
    dataSource,
  } = useDataSource(
    subscriptionDetails.current,
    gridModel,
    onConfigChange,
    handleSizeChange
  );

  const rowCount = dataSource?.rowCount ?? 0;

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
          current?.beginVerticalScroll()
        );
      } else {
        canvasRefs.current.forEach(({ current }) =>
          current?.endVerticalScroll(scrollTop)
        );
      }
    },
    [rowHeight, viewportRowCount, rowCount, setRange]
  );

  useEffectSkipFirst(() => {
    if (viewportEl.current) {
      viewportEl.current.scrollTop = 0;
    }
  }, [dataSource]);

  useLayoutEffect(() => {
    if (columnDragData && viewportEl.current && insertIndicatorRef.current) {
      const { column, columnGroupIdx } = columnDragData;
      const canvas = canvasRefs.current[columnGroupIdx].current;
      if (canvas) {
        const columnOffset = canvas.beginDrag(column) ?? 0;
        const { left } = viewportEl.current.getBoundingClientRect();
        insertIndicatorRef.current.style.left = columnOffset - left + "px";
      }
    }
  }, [columnDragData]);

  const [handleVerticalScroll, suspendScrollHandling] = useScroll(
    "scrollTop",
    scrollCallback
  );

  const contextMenuOptions = useMemo(() => {
    return {
      selectedRowCount: countSelectedRows(data),
      viewport: dataSource?.viewport,
    };
  }, [data, dataSource]);

  const showContextMenu = useContextMenu();
  const handleContextMenu = (e: MouseEvent) => {
    showContextMenu(e, "grid", contextMenuOptions);
  };

  useImperativeHandle(forwardedRef, () => ({
    beginHorizontalScroll: () => {
      if (!showColumnBearer.current && scrollingEl.current) {
        const header =
          gridModel.headerHeight * (gridModel.headingDepth ?? 1) +
          gridModel.customInlineHeaderHeight;
        scrollingEl.current.style.height = `${
          header +
          Math.max(
            rowCount * rowHeight + (horizontalScrollbarHeight.current ?? 0),
            gridModel.viewportHeight
          )
        }px`;
        canvasRefs.current.forEach(({ current }) =>
          current?.beginHorizontalScroll()
        );
      }
    },
    endHorizontalScroll: () => {
      if (!showColumnBearer.current) {
        canvasRefs.current.forEach(({ current }) => {
          current && current.endHorizontalScroll();
        });
        if (scrollingEl.current) {
          scrollingEl.current.style.height = `${Math.max(
            rowCount * rowHeight + (horizontalScrollbarHeight.current ?? 0),
            gridModel.viewportHeight
          )}px`;
          return canvasRefs.current[scrollableCanvasIdx].current?.scrollLeft;
        }
      }
    },
  }));

  const scrollBy = useCallback(
    (rows) => {
      if (viewportEl.current) {
        const { scrollTop } = viewportEl.current;
        const scrollAmt =
          rows === 1
            ? rowHeight - ((viewportHeight + scrollTop) % rowHeight) ||
              rowHeight
            : rows === -1
            ? -(scrollTop % rowHeight) || -rowHeight
            : scrollTop + rows * rowHeight - (scrollTop % rowHeight);
        viewportEl.current.scrollTop = scrollTop + scrollAmt;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [rowHeight, viewportHeight]
  );

  const scrollEnd = useCallback(
    (startOrEnd) => {
      if (viewportEl.current) {
        suspendScrollHandling(true);
        const scrollPos =
          startOrEnd === "start" ? 0 : rowCount * rowHeight - viewportHeight;
        viewportEl.current.scrollTop = scrollPos;
        suspendScrollHandling(false);
      }
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
        className="vuuDataGrid-Viewport"
        ref={viewportEl}
        style={{ height: gridModel.viewportHeight }}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        onScroll={handleVerticalScroll}
        tabIndex={-1}
      >
        <div
          className="vuuDataGrid-scrollingCanvasContainer"
          ref={scrollingEl}
          style={{
            height: Math.max(
              rowHeight * contentRowCount +
                (horizontalScrollbarHeight.current ?? 0),
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
                  horizontalScrollbarHeight={
                    horizontalScrollbarHeight.current ?? 0
                  }
                  key={idx}
                  onColumnDragStart={onColumnDragStart}
                  onRowClick={onRowClick}
                  ref={canvasRefs.current[idx]}
                  data={data}
                />
              ))
            : null}
        </div>
      </div>
      {columnDragData && (
        <>
          <InsertIndicator ref={insertIndicatorRef} />
          <ColumnBearer
            columnDragData={columnDragData}
            gridModel={gridModel}
            initialScrollPosition={
              canvasRefs.current[scrollableCanvasIdx].current?.scrollLeft ?? 0
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
