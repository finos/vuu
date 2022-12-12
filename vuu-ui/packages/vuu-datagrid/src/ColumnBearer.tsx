import React, {
  ForwardedRef,
  forwardRef,
  HTMLAttributes,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import cx from "classnames";
import { GridCell, HeaderCell } from "./grid-cells";
import useDrag, { DRAG, DRAG_END } from "./use-drag";
import { getColumnGroup } from "./grid-model/gridModelUtils";

import "./column-bearer.css";
import { GridModelType, KeyedColumnDescriptor } from "./grid-model";
import { DataSourceRow } from "@vuu-ui/vuu-data";
import { ColumnDragState, dragPhase } from "./gridTypes";
import { buildColumnMap } from "@vuu-ui/vuu-utils";

const LEFT = "left";
const RIGHT = "right";

export interface ColumnBearerAPI {
  setFinalPosition: (position: number) => void;
}

// Identify a single dropPosition, no matter the width of the dragged column or the widths
// of target columns.
function getBestDropTarget(
  columnPositions: number[][],
  dragPosition: number,
  columnWidth: number,
  scrollPosition: number
) {
  const columnStart = dragPosition + scrollPosition;
  const columnEnd = columnStart + columnWidth;
  // console.log(`getClosestPosition ${columnPositions} columnStart: ${columnStart} columnEnd ${columnEnd}`)
  const results = [];
  const visited = [];
  let idx;
  for (const groupPositions of columnPositions) {
    for (const position of groupPositions) {
      visited.push(position);
      if (columnStart <= position && columnEnd >= position) {
        results.push(position);
      } else if (columnEnd < position) {
        break;
      }
    }
  }

  if (results.length === 1) {
    idx = results[0];
  } else if (results.length === 0) {
    const p2 = visited.pop() as number;
    const p1 = visited.pop() as number;
    idx = columnStart - p1 < p2 - columnEnd ? p1 : p2;
  } else {
    const mid = columnEnd - columnStart;
    idx = results.reduce(
      (p1, p2) => (Math.abs(p1 - mid) < Math.abs(p2 - mid) ? p1 : p2),
      99999
    );
  }

  return idx;
}

function getTargetColumn(
  { column, columnPositions }: ColumnDragState,
  dragPosition: number,
  scrollPosition: number
) {
  const targetPosition = getBestDropTarget(
    columnPositions,
    dragPosition,
    column.width,
    scrollPosition
  );
  const columnStart = dragPosition + scrollPosition;
  const [[offsetLeft]] = columnPositions;
  // This must be more sensitive detecting moves over another columnGroup
  for (let i = 0, idx = 0; i < columnPositions.length; i++) {
    const positions = columnPositions[i];
    for (let j = 0; j < positions.length; j++, idx++) {
      if (positions[j] === targetPosition) {
        const position = targetPosition - offsetLeft;
        let groupIdx = i;
        if (i > 0 && j === 0) {
          // break between 2 groups
          const centerPoint = columnStart + column.width / 2;
          if (centerPoint < position) {
            groupIdx -= 1;
          }
        }
        return [idx, position - scrollPosition, groupIdx];
      }
    }
  }
  return [-1, -1, -1];
}

function getScrollBounds(
  gridModel: GridModelType,
  column: KeyedColumnDescriptor
) {
  const { columnGroups, width } = gridModel;
  if (!columnGroups || width === undefined) {
    throw Error(
      "ColumnBearer getScrollBounds no columnGroups or width is not defined"
    );
  }

  let scrollableLeft = 0;
  let scrollableRight = 0;
  for (const columnGroup of columnGroups) {
    if (columnGroup.locked && scrollableLeft === 0) {
      scrollableLeft += columnGroup.width;
      scrollableRight += columnGroup.width;
    } else if (!columnGroup.locked) {
      scrollableRight += columnGroup.width;
    }
  }

  return {
    left: 0,
    right: width - column.width,
    scrollableLeft: scrollableLeft,
    scrollableRight: scrollableRight - column.width,
  };
}

function useScrollBounds(
  gridModel: GridModelType,
  column: KeyedColumnDescriptor
) {
  const scrollBounds = useRef(getScrollBounds(gridModel, column));

  const withinScrollZone = useCallback(
    (pos: number): "left" | "right" | null => {
      const {
        current: { scrollableLeft, scrollableRight },
      } = scrollBounds;
      if (pos >= scrollableLeft - 20 && pos < scrollableLeft) {
        return LEFT;
      } else if (pos > scrollableRight && pos <= scrollableRight + 20) {
        return RIGHT;
      } else {
        return null;
      }
    },
    []
  );

  return { scrollBounds: scrollBounds.current, withinScrollZone };
}

export interface ColumnBearerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onScroll" | "onDrag"> {
  columnDragData: ColumnDragState;
  gridModel: GridModelType;
  onDrag: (
    phase: dragPhase,
    column: KeyedColumnDescriptor,
    insertIdx: number,
    insertPos: number,
    columnPosition?: number
  ) => void;
  onScroll: (distance: number) => number;
  initialScrollPosition: number;
  rows: DataSourceRow[];
}

export const ColumnBearer = forwardRef(
  (
    {
      columnDragData,
      gridModel,
      onDrag,
      onScroll,
      rows,
      initialScrollPosition,
    }: ColumnBearerProps,
    ref: ForwardedRef<ColumnBearerAPI>
  ) => {
    const {
      headerHeight,
      headingDepth = 1,
      rowHeight,
      viewportHeight,
    } = gridModel;

    const top = headerHeight * (headingDepth - 1);
    const columnPosition = useRef<number>(columnDragData.initialColumnPosition);
    const columnGroupIdx = useRef<number>(columnDragData.columnGroupIdx);
    const { scrollBounds, withinScrollZone } = useScrollBounds(
      gridModel,
      columnDragData.column
    );
    const el = useRef<HTMLDivElement>(null);
    const disableDragRef = useRef<() => void>(); // avoid circular ref
    const scrollTimeout = useRef<number | null>(null);
    const scrollPosition = useRef<number>(initialScrollPosition);
    const prevPosition = useRef<number>(-1);
    const columnMap = useMemo(
      () => buildColumnMap(gridModel.columnNames),
      [gridModel.columnNames]
    );

    const { column } = columnDragData;

    const style = {
      top: top + 15,
      left: columnPosition.current,
      height: (gridModel.height ?? 200) - top - 15,
      width: column.width,
    };

    const scroll = useCallback(
      (scrollDistance) => () => {
        const distanceScrolled = onScroll(scrollDistance);
        scrollPosition.current += distanceScrolled;
        if (
          distanceScrolled !== 0 &&
          withinScrollZone(columnPosition.current)
        ) {
          scrollTimeout.current = requestAnimationFrame(scroll(scrollDistance));
        }
      },
      [onScroll, withinScrollZone]
    );

    const cancelScroll = () => {
      if (scrollTimeout.current) {
        cancelAnimationFrame(scrollTimeout.current);
      }
      scrollTimeout.current = null;
    };

    useEffect(() => {
      return () => console.log(`columnbearer unmount`);
    }, []);

    useImperativeHandle(ref, () => ({
      setFinalPosition: (pos) => {
        if (el.current) {
          console.log(`ColumnBearer finalPosition `);
          el.current.style.transition = "left, top ease .3s";
          el.current.style.top = `0px`;
          el.current.style.left = pos + `px`;
        }
      },
    }));

    const setColumnBearerClassName = useCallback(
      (columnGroupIdx) => {
        const { columnGroups } = gridModel;
        if (el.current && columnGroups) {
          const columnGroup = columnGroups[columnGroupIdx];
          if (columnGroup.locked) {
            el.current.classList.add("fixed");
          } else {
            el.current.classList.remove("fixed");
          }
        }
      },
      [gridModel]
    );

    const dragCallback = useCallback(
      (dragPhase, delta) => {
        if (dragPhase === "drag" && el.current) {
          const newPosition = Math.max(
            scrollBounds.left,
            Math.min(columnPosition.current + delta, scrollBounds.right + 5)
          );

          if (newPosition !== columnPosition.current) {
            columnPosition.current = newPosition;
            el.current.style.left = columnPosition.current + "px";
          }

          const [insertIdx, insertPos, groupIdx] = getTargetColumn(
            columnDragData,
            columnPosition.current,
            scrollPosition.current
          );
          if (groupIdx !== columnGroupIdx.current) {
            setColumnBearerClassName(groupIdx);
            columnGroupIdx.current = groupIdx;
          }
          if (insertPos !== prevPosition.current) {
            onDrag?.("drag", column, insertIdx, insertPos);
          }
          prevPosition.current = insertPos;

          // We should probably just fire onDrag and let Viewport worry about this
          const direction = withinScrollZone(columnPosition.current);
          if (direction && !scrollTimeout.current) {
            scrollTimeout.current = requestAnimationFrame(
              scroll(direction === "right" ? 10 : -10)
            );
          } else if (!direction && scrollTimeout.current) {
            cancelScroll();
          }
        } else {
          if (scrollTimeout.current) {
            cancelScroll();
          }
          disableDragRef.current?.();
          const [insertIdx] = getTargetColumn(
            columnDragData,
            columnPosition.current,
            scrollPosition.current
          );
          onDrag(
            "drag-end",
            column,
            insertIdx,
            prevPosition.current,
            columnPosition.current
          );
        }
      },
      [
        column,
        columnDragData,
        onDrag,
        scroll,
        scrollBounds,
        setColumnBearerClassName,
        withinScrollZone,
      ]
    );

    const [, disableDrag] = useDrag(
      dragCallback,
      DRAG + DRAG_END,
      columnDragData.mousePosition
    );
    disableDragRef.current = disableDrag;

    const columnGroup = getColumnGroup(gridModel, column);

    return (
      <div
        className={cx("ColumnBearer", {
          fixed: columnGroup?.locked,
        })}
        ref={el}
        style={style}
      >
        <div className="hwColumnGroupHeader" style={{ height: headerHeight }}>
          <HeaderCell column={column} />
        </div>
        <div style={{ position: "relative", height: viewportHeight }}>
          {rows.map((row, idx) => (
            <div
              key={idx}
              className={cx("hwDataGridRow", {
                "hwDataGridRow-even": idx % 2 === 0,
              })}
              style={{
                height: rowHeight,
                transform: `translate3d(0px, ${idx * rowHeight}px, 0px)`,
              }}
            >
              <GridCell
                column={column}
                columnMap={columnMap}
                key={idx}
                row={row}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }
);

ColumnBearer.displayName = "ColumnBearer";
