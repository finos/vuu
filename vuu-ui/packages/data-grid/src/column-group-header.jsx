import React, { forwardRef, useCallback, useContext, useImperativeHandle, useRef } from 'react';
import cx from 'classnames';
import GridContext from './grid-context';
import { GridModel } from './grid-model/grid-model-utils';
import ColumnGroupContext from './column-group-context';
import { SortType } from './constants';

import { HeaderCell, HeadingCell, GroupHeaderCell } from './grid-cells';

import './column-group-header.css';

const classBase = 'hwColumnGroupHeader';

/** @type {ColumnGroupHeaderType} */
const ColumnGroupHeader = React.memo(
  forwardRef(function ColumnGroupHeader(
    { columnGroup, columnGroupIdx, columns = columnGroup.columns, onColumnDragStart },
    ref
  ) {
    const columnGroupHeader = useRef(null);
    const scrollingHeaderWrapper = useRef(null);
    const { custom, dispatchGridAction, dispatchGridModelAction, gridModel } =
      useContext(GridContext);

    const sortIndicator = (sort, column) => {
      if (!sort) {
        return undefined;
      } else {
        const multiColumnSort = sort.length > 1;
        const sortEntry = sort.find((item) => item.column === column.name);
        return sortEntry === undefined
          ? undefined
          : multiColumnSort
          ? (sort.indexOf(sortEntry) + 1) * (sortEntry.sortType === SortType.DSC ? -1 : 1)
          : sortEntry.sortType === SortType.ASC
          ? 'asc'
          : 'dsc';
      }
    };

    useImperativeHandle(ref, () => ({
      beginHorizontalScroll: (width) => {
        columnGroupHeader.current.style.width = width + 'px';
        scrollingHeaderWrapper.current.style.transform = `translate3d(0px, 0px, 0px)`;
      },
      endHorizontalScroll: (scrollLeft, width) => {
        scrollingHeaderWrapper.current.style.transform = `translate3d(-${scrollLeft}px, 0px, 0px)`;
        columnGroupHeader.current.style.width = width + 'px';
      }
    }));

    const handleColumnResize = useCallback(
      (phase, column, width) => {
        dispatchGridModelAction({ type: 'resize-col', phase, column, width });
      },
      [dispatchGridModelAction]
    );

    const handleHeadingResize = useCallback(
      (phase, column, width) => {
        dispatchGridModelAction({
          type: 'resize-heading',
          phase,
          column,
          width
        });
      },
      [dispatchGridModelAction]
    );

    const handleDrag = useCallback(
      (phase, column, columnPosition, mousePosition) => {
        onColumnDragStart(phase, columnGroupIdx, column, columnPosition, mousePosition);
      },
      [columnGroupIdx, onColumnDragStart]
    );

    const handleRemoveGroup = useCallback(
      (column) => {
        dispatchGridAction({
          type: 'group',
          key: GridModel.removeGroupColumn(gridModel, column)
        });
      },
      [dispatchGridAction, gridModel]
    );

    const {
      customHeaderHeight: top,
      customInlineHeaderHeight,
      headerHeight,
      headingDepth,
      sort
    } = gridModel;
    const height = headerHeight * headingDepth;

    const renderColHeadings = (heading) =>
      heading.map((item, idx) => (
        <HeadingCell
          key={idx}
          className={cx({ noBottomBorder: item.label === '' })}
          column={item}
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
        <div ref={scrollingHeaderWrapper} style={{ height, width: contentWidth }}>
          {headings
            .map((heading, idx) => (
              <div key={idx} style={{ height: headerHeight, width }}>
                {renderColHeadings(heading)}
              </div>
            ))
            .reverse()}

          <div role="row" style={{ height: headerHeight, width: contentWidth }}>
            {columns.map((column) =>
              column.isGroup ? (
                <GroupHeaderCell
                  column={column}
                  key={column.key}
                  onClick={() => console.log('onClick')}
                  onResize={handleColumnResize}
                  onToggleGroupState={() => console.log('onToggleGroupState')}
                  onRemoveColumn={handleRemoveGroup}
                />
              ) : (
                <HeaderCell
                  column={column}
                  filter={gridModel.filter}
                  key={column.key}
                  onDrag={handleDrag}
                  onResize={handleColumnResize}
                  sorted={sortIndicator(sort, column)}
                />
              )
            )}
          </div>
        </div>
        <ColumnGroupContext.Provider value={columnGroup}>
          {custom.inlineHeader.component}
        </ColumnGroupContext.Provider>
      </div>
    );
  })
);

export default ColumnGroupHeader;

ColumnGroupHeader.displayName = 'ColumnGroupHeader';
