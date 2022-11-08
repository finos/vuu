import React, { useCallback, useRef } from 'react';
import cx from 'classnames';
import Draggable from '../draggable';

/** @type {HeaderCellComponent} */
export const HeadingCell = function HeaderCell({ className, column, onResize }) {
  const el = useRef(null);
  const col = useRef(column);

  // essential that handlers for resize do not use stale column
  // we could mitigate this by only passing column key and passing delta,
  // so we don't rely on current width in column
  col.current = column;

  const handleResizeStart = () => onResize('begin', column);

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

  const getWidthFromMouseEvent = (e) => {
    const right = e.pageX;
    const left = el.current.getBoundingClientRect().left;
    return right - left;
  };

  // TODO could we just wrap the whole header in a draggable ?
  const { name, label = name, resizing, width } = column;
  return (
    <div className={cx('hwHeaderCell', className, { resizing })} ref={el} style={{ width }}>
      <div className={'innerHeaderCell'}>
        <div className={'cellWrapper'}>{label}</div>
      </div>
      {column.resizeable !== false && (
        <Draggable
          className={'resizeHandle'}
          onDrag={handleResize}
          onDragStart={handleResizeStart}
          onDragEnd={handleResizeEnd}
        />
      )}
    </div>
  );
};
