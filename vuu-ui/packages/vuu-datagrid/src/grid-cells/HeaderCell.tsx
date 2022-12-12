import { useContextMenu } from "@vuu-ui/ui-controls";
import { Filter } from "@vuu-ui/vuu-filters";
import cx from "classnames";
import { MouseEvent, useCallback, useRef } from "react";
import { AggregationType } from "../constants";
import { useGridContext } from "../grid-context";
import { KeyedColumnDescriptor } from "../grid-model";
import { GridModel } from "../grid-model/gridModelUtils";
import { dragPhase, resizePhase } from "../gridTypes";
import { useDragStart } from "../use-drag";
import { ColResizer } from "./ColResizer";
import { FilterIndicator } from "./filter-indicator";
import { GridCellProps } from "./GridCell";
import { SortIndicator, sortStatus } from "./sort-indicator";
import { useCellResize } from "./useCellResize";

import "./HeaderCell.css";

const classBase = "hwHeaderCell";
const NO_AGGREGATION = { aggType: -1 };

const AggTypeLabel = {
  [AggregationType.Average]: "Avg",
  [AggregationType.Count]: "count",
  [AggregationType.Sum]: "\u03A3",
  [AggregationType.High]: "High",
  [AggregationType.Low]: "Low",
  none: "",
};

export interface HeaderCellProps
  extends Omit<GridCellProps, "columnMap" | "onDrag" | "row"> {
  filter?: Filter;
  onDrag?: (
    phase: dragPhase,
    column: KeyedColumnDescriptor,
    columnPosition: number,
    mousePosition: number
  ) => void;
  onResize?: (phase: resizePhase, columnName: string, width?: number) => void;
  sorted?: sortStatus;
}

export const HeaderCell = function HeaderCell({
  className: classNameProp,
  column,
  filter,
  onDrag,
  onResize,
  sorted,
}: HeaderCellProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const col = useRef<KeyedColumnDescriptor>(column);
  // const isResizing = useRef(false);
  const { dispatchGridAction, gridModel } = useGridContext();

  const { isResizing, ...resizeProps } = useCellResize({
    column,
    onResize,
    rootRef,
  });

  // essential that handlers for resize do not use stale column
  // we could mitigate this by only passing column key and passing delta,
  // so we don't rely on current width in column
  col.current = column;

  const [handleMouseDown] = useDragStart(
    useCallback(
      (phase: dragPhase, delta: number, mousePosition: number) => {
        if (rootRef.current) {
          const { left } = rootRef.current.getBoundingClientRect();
          onDrag && onDrag(phase, col.current, left + delta, mousePosition);
        }
      },
      [onDrag, col]
    )
  );

  const handleClick = useCallback(() => {
    if (!isResizing && gridModel) {
      console.log("Click");
      dispatchGridAction?.({
        type: "sort",
        sort: GridModel.setSortColumn(gridModel, column),
      });
    }
  }, [column, dispatchGridAction, gridModel, isResizing]);

  const showContextMenu = useContextMenu();

  const handleContextMenu = (e: MouseEvent) => {
    showContextMenu(e, "header", { column });
  };

  const groupBy = gridModel?.groupBy;
  const { aggType } =
    groupBy && groupBy?.length > 0
      ? gridModel.aggregations.find((agg) => agg.column === column.name) ||
        NO_AGGREGATION
      : NO_AGGREGATION;
  const aggLabel = AggTypeLabel[aggType] ?? "";

  // TODO could we just wrap the whole header in a draggable ?
  const {
    name,
    label = name,
    resizing,
    width,
    marginLeft = undefined,
    type,
  } = column;

  const typeName = typeof type === "string" ? type : type?.name;

  return (
    <div
      className={cx(classBase, classNameProp, column.className, {
        [`${classBase}-resizing`]: resizing,
        [`${classBase}-${typeName}`]: typeName,
      })}
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      ref={rootRef}
      role="columnheader"
      style={{ marginLeft, width }}
      tabIndex={-1}
    >
      <FilterIndicator column={column} filter={filter} />
      <div className="innerHeaderCell">
        <div className="cellWrapper">{`${aggLabel} ${label}`}</div>
      </div>
      <SortIndicator sorted={sorted} />
      {column.resizeable !== false && <ColResizer {...resizeProps} />}
    </div>
  );
};
