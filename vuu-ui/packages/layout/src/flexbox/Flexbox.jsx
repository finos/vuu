import React, { forwardRef } from 'react';
import cx from 'classnames';
import { useForkRef } from '../utils';
import { useSplitterResizing } from './useSplitterResizing';
import './Flexbox.css';

const classBase = 'hwFlexbox';

const Flexbox = forwardRef(function Flexbox(props, ref) {
  const {
    breakPoints,
    children,
    column,
    cols: colsProp,
    className: classNameProp,
    flexFill,
    gap,
    fullPage,
    id,
    onSplitterMoved,
    resizeable,
    row,
    spacing,
    splitterSize,
    style,
    ...rest
  } = props;

  const { cols, content, rootRef } = useSplitterResizing({
    children,
    cols: colsProp,
    onSplitterMoved,
    style
  });

  const className = cx(classBase, classNameProp, {
    [`${classBase}-column`]: column,
    [`${classBase}-row`]: row,
    'flex-fill': flexFill,
    'full-page': fullPage
  });

  return (
    <div
      {...rest}
      className={className}
      data-cols={cols}
      data-resizeable={resizeable || undefined}
      id={id}
      ref={useForkRef(rootRef, ref)}
      style={{
        ...style,
        gap,
        '--spacing': spacing
      }}>
      {content}
    </div>
  );
});
Flexbox.displayName = 'Flexbox';

export default Flexbox;
