import React, { useCallback, useContext, useRef } from 'react';
import cx from 'classnames';
import { useContextMenu } from '@vuu-ui/ui-controls';

import GridContext from '../grid-context';
import { GridModel } from '../grid-model/grid-model-utils';
import { useDragStart } from '../use-drag';
import { FilterIndicator } from './filter-indicator';
import { SortIndicator } from './sort-indicator';
import Draggable from '../draggable';
import { AggregationType } from '../constants';

import './header-cell.css';

const classBase = 'hwHeaderCell';
const NO_AGGREGATION = { aggType: 'none' };

const AggTypeLabel = {
  [AggregationType.Average]: 'Avg',
  [AggregationType.Count]: 'count',
  [AggregationType.Sum]: '\u03A3',
  [AggregationType.High]: 'High',
  [AggregationType.Low]: 'Low',
  none: ''
};

export const HeaderCell = function HeaderCell({
  className: classNameProp,
  column,
  filter,
  onDrag,
  onResize,
  sorted
}) {
  const el = useRef(null);
  const col = useRef(column);
  const isResizing = useRef(false);
  const { dispatchGridAction, gridModel } = useContext(GridContext);

  // essential that handlers for resize do not use stale column
  // we could mitigate this by only passing column key and passing delta,
  // so we don't rely on current width in column
  col.current = column;

  const [handleMouseDown] = useDragStart(
    useCallback(
      (dragPhase, delta, mousePosition) => {
        const { left } = el.current.getBoundingClientRect();
        onDrag && onDrag(dragPhase, col.current, left + delta, mousePosition);
      },
      [onDrag, col]
    )
  );

  const handleClick = () => {
    if (isResizing.current) {
      isResizing.current = false;
    } else {
      dispatchGridAction({
        type: 'sort',
        columns: GridModel.setSortColumn(gridModel, column)
      });
    }
  };

  const handleResizeStart = () => {
    // Note: the click handler will fire after the resizeEnd (mouseUp) handler and reset this
    isResizing.current = true;
    onResize('begin', column);
  };

  const handleResize = useCallback(
    (e) => {
      const width = getWidthFromMouseEvent(e);
      if (width > 0 && width !== col.current.width) {
        onResize('resize', col.current, width);
      }
    },
    [onResize]
  );

  const handleResizeEnd = (e) => {
    onResize('end', col.current, getWidthFromMouseEvent(e));
  };

  const showContextMenu = useContextMenu();

  const handleContextMenu = (e) => {
    showContextMenu(e, 'header', { column });
  };

  const getWidthFromMouseEvent = (e) => {
    const right = e.pageX;
    const left = el.current.getBoundingClientRect().left;
    return right - left;
  };

  const { aggType } =
    gridModel.groupBy?.length > 0
      ? gridModel.aggregations.find((agg) => agg.column === column.name) || NO_AGGREGATION
      : NO_AGGREGATION;
  const aggLabel = AggTypeLabel[aggType];

  // TODO could we just wrap the whole header in a draggable ?
  const { name, label = name, resizing, width, marginLeft = null, type } = column;

  return (
    <div
      className={cx(classBase, classNameProp, column.className, {
        [`${classBase}-resizing`]: resizing,
        [`${classBase}-${type?.name}`]: type?.name
      })}
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      ref={el}
      role="columnheader"
      style={{ marginLeft, width }}
      tabIndex={-1}>
      <FilterIndicator column={column} filter={filter} />
      <div className="innerHeaderCell">
        <div className="cellWrapper">{`${aggLabel} ${label}`}</div>
      </div>
      <SortIndicator sorted={sorted} />
      {column.resizeable !== false && (
        <Draggable
          className="resizeHandle"
          onDrag={handleResize}
          onDragStart={handleResizeStart}
          onDragEnd={handleResizeEnd}
        />
      )}
    </div>
  );
};
