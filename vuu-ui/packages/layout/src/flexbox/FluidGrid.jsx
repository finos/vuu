import React, { forwardRef } from 'react';
import cx from 'classnames';
import { useForkRef } from '../utils';
import { useResponsiveSizing } from './useResponsiveSizing';
import { useBreakpoints } from '../responsive/use-breakpoints';
import './FluidGrid.css';

const classBase = 'hwFluidGrid';

const FluidGrid = forwardRef(function FluidGrid(props, ref) {
  const {
    breakPoints,
    children,
    column,
    cols: colsProp = 12,
    className: classNameProp,
    flexFill,
    gap = 3,
    fullPage,
    id,
    onSplitterMoved,
    resizeable,
    row,
    showGrid,
    spacing,
    splitterSize,
    style: styleProp,
    ...rest
  } = props;

  const { cols, content, rootRef } = useResponsiveSizing({
    children,
    cols: colsProp,
    onSplitterMoved,
    style: styleProp
  });

  const breakpoint = useBreakpoints(
    {
      breakPoints
    },
    rootRef
  );

  const className = cx(classBase, classNameProp, {
    [`${classBase}-column`]: column,
    [`${classBase}-row`]: row,
    [`${classBase}-show-grid`]: showGrid,
    'flex-fill': flexFill,
    'full-page': fullPage
  });

  const style = {
    ...styleProp,
    '--spacing': spacing,
    // only needed to display the cols
    '--grid-col-count': cols,
    '--grid-gap': gap
  };

  return (
    <div
      {...rest}
      className={className}
      data-breakpoint={breakpoint}
      data-cols={cols}
      data-resizeable={resizeable || undefined}
      id={id}
      ref={useForkRef(rootRef, ref)}
      style={style}
    >
      {content}
    </div>
  );
});
FluidGrid.displayName = 'FluidGrid';

export default FluidGrid;
