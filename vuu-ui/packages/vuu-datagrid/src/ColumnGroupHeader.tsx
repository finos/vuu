import cx from "classnames";
import React, {
  ForwardedRef,
  forwardRef,
  HTMLAttributes,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react";
import { Heading } from "@finos/vuu-datagrid-types";
import { VuuSort } from "../../vuu-protocol-types";
import ColumnGroupContext from "./column-group-context";
import { SortType } from "./constants";
import { GroupHeaderCell, HeaderCell, HeadingCell } from "./grid-cells";
import { useGridContext } from "./grid-context";
import { ColumnGroupType } from "./grid-model/gridModelTypes";
import { GridModel } from "./grid-model/gridModelUtils";
import { ColumnDragStartHandler, resizePhase } from "./gridTypes";

import { RuntimeColumnDescriptor } from "@finos/vuu-datagrid-types";
import { isGroupColumn } from "@finos/vuu-utils";
import "./ColumnGroupHeader.css";

const classBase = "hwColumnGroupHeader";

export interface ColumnGroupHeaderAPI {
  beginHorizontalScroll: (width: number) => void;
  endHorizontalScroll: (scrollLeft: number, width: number) => void;
}

export interface ColumnGroupHeaderProps extends HTMLAttributes<HTMLDivElement> {
  columnGroup: ColumnGroupType;
  columnGroupIdx: number;
  onColumnDragStart?: ColumnDragStartHandler;
}

const ColumnGroupHeader = React.memo(
  forwardRef(function ColumnGroupHeader(
    { columnGroup, columnGroupIdx, onColumnDragStart }: ColumnGroupHeaderProps,
    ref: ForwardedRef<ColumnGroupHeaderAPI>
  ) {
    const columns = columnGroup.columns;
    const columnGroupHeader = useRef<HTMLDivElement>(null);
    const scrollingHeaderWrapper = useRef<HTMLDivElement>(null);
    const { custom, dispatchGridAction, dispatchGridModelAction, gridModel } =
      useGridContext();
    // TODO add a param to useGridContext so it will throw if gridModel missing
    if (!gridModel) {
      throw Error("no grid model");
    }

    const sortIndicator = (
      sort: VuuSort | undefined,
      column: RuntimeColumnDescriptor
    ) => {
      if (!sort || sort.sortDefs.length === 0) {
        return undefined;
      } else {
        const { sortDefs } = sort;
        const multiColumnSort = sortDefs.length > 1;
        const sortEntry = sortDefs.find((item) => item.column === column.name);
        return sortEntry === undefined
          ? undefined
          : multiColumnSort
          ? (sortDefs.indexOf(sortEntry) + 1) *
            (sortEntry.sortType === SortType.DSC ? -1 : 1)
          : sortEntry.sortType === SortType.ASC
          ? "asc"
          : "dsc";
      }
    };

    useImperativeHandle(ref, () => ({
      beginHorizontalScroll: (width) => {
        if (columnGroupHeader.current && scrollingHeaderWrapper.current) {
          columnGroupHeader.current.style.width = width + "px";
          scrollingHeaderWrapper.current.style.transform = `translate3d(0px, 0px, 0px)`;
        }
      },
      endHorizontalScroll: (scrollLeft, width) => {
        if (columnGroupHeader.current && scrollingHeaderWrapper.current) {
          scrollingHeaderWrapper.current.style.transform = `translate3d(-${scrollLeft}px, 0px, 0px)`;
          columnGroupHeader.current.style.width = width + "px";
        }
      },
    }));

    const handleColumnResize = useCallback(
      (phase, columnName, width) => {
        dispatchGridAction?.({ type: "resize-col", phase, columnName, width });
      },
      [dispatchGridAction]
    );

    const handleHeadingResize = useCallback(
      (phase: resizePhase, headingName: string, width?: number) => {
        dispatchGridModelAction?.({
          type: "resize-heading",
          phase,
          headingName,
          width,
        });
      },
      [dispatchGridModelAction]
    );

    const handleDrag = useCallback(
      (phase, column, columnPosition, mousePosition) => {
        onColumnDragStart?.(
          phase,
          columnGroupIdx,
          column,
          columnPosition,
          mousePosition
        );
      },
      [columnGroupIdx, onColumnDragStart]
    );

    const handleRemoveGroup = useCallback(
      (column) => {
        if (gridModel) {
          dispatchGridAction?.({
            type: "group",
            key: GridModel.removeGroupColumn(gridModel, column),
          });
        }
      },
      [dispatchGridAction, gridModel]
    );

    const handleHeaderClick = useCallback(
      (_groupColumn, column: RuntimeColumnDescriptor) => {
        if (gridModel) {
          dispatchGridAction?.({
            type: "sort",
            sort: GridModel.setSortColumn(gridModel, column),
          });
        }
      },
      [dispatchGridAction, gridModel]
    );

    const {
      customHeaderHeight: top,
      customInlineHeaderHeight,
      headerHeight,
      headingDepth = 1,
    } = gridModel;
    const height = headerHeight * headingDepth;

    const renderColHeadings = (heading: Heading[]) =>
      heading.map((item, idx) => (
        <HeadingCell
          key={idx}
          className={cx({ noBottomBorder: item.label === "" })}
          heading={item}
          onResize={handleHeadingResize}
        />
      ));

    const { contentWidth, headings = [], width } = columnGroup;
    return (
      <div
        className={classBase}
        ref={columnGroupHeader}
        style={{ height: height + customInlineHeaderHeight, top, width }}
      >
        <div
          ref={scrollingHeaderWrapper}
          style={{ height, width: contentWidth }}
        >
          {headings
            .map((heading, idx) => (
              <div key={idx} style={{ height: headerHeight, width }}>
                {renderColHeadings(heading)}
              </div>
            ))
            .reverse()}

          <div role="row" style={{ height: headerHeight, width: contentWidth }}>
            {columns.map((column) =>
              isGroupColumn(column) ? (
                <GroupHeaderCell
                  column={column}
                  key={column.name}
                  onClick={handleHeaderClick}
                  onResize={handleColumnResize}
                  onToggleGroupState={() => console.log("onToggleGroupState")}
                  onRemoveColumn={handleRemoveGroup}
                />
              ) : (
                <HeaderCell
                  column={column}
                  filter={gridModel.filter}
                  key={column.name}
                  onDrag={handleDrag}
                  onResize={handleColumnResize}
                  sorted={sortIndicator(gridModel.sort, column)}
                />
              )
            )}
          </div>
        </div>
        <ColumnGroupContext.Provider value={columnGroup}>
          {custom?.inlineHeader.component}
        </ColumnGroupContext.Provider>
      </div>
    );
  })
);

export default ColumnGroupHeader;

ColumnGroupHeader.displayName = "ColumnGroupHeader";
