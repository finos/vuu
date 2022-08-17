import React, { CSSProperties, ReactElement } from 'react';
import { followPath, getProps } from '../utils';
import { swapChild } from './replace-layout-element';
import { LayoutModel, SplitterResizeAction } from './layoutTypes';
import { dimension } from '../common-types';

export function resizeFlexChildren(rootProps: LayoutModel, { path, sizes }: SplitterResizeAction) {
  const target = followPath(rootProps, path) as LayoutModel;
  const { children, style } = getProps(target);

  const dimension = style.flexDirection === 'column' ? 'height' : 'width';
  const replacementChildren = applySizesToChildren(children, sizes, dimension);

  const replacement = React.isValidElement(target)
    ? React.cloneElement(target, undefined, replacementChildren)
    : { ...target, children: replacementChildren };

  return swapChild(rootProps, target, replacement);
}

function applySizesToChildren(
  children: ReactElement[],
  sizes: { currentSize: number; flexBasis: number }[],
  dimension: dimension
) {
  return children.map((child, i) => {
    const {
      style: { [dimension]: size, flexBasis: actualFlexBasis }
    } = getProps(child);
    const meta = sizes[i];
    let { currentSize, flexBasis } = meta;
    const hasCurrentSize = currentSize !== undefined;
    const newSize = hasCurrentSize ? meta.currentSize : flexBasis;

    if (newSize === undefined || size === newSize || actualFlexBasis === newSize) {
      return child;
    } else {
      return React.cloneElement(child, {
        style: applySizeToChild(child.props.style, dimension, newSize)
      });
    }
  });
}

function applySizeToChild(style: CSSProperties, dimension: dimension, newSize: number) {
  const hasSize = typeof style[dimension] === 'number';
  const { flexShrink = 1, flexGrow = 1 } = style;
  return {
    ...style,
    [dimension]: hasSize ? newSize : 'auto',
    flexBasis: hasSize ? 'auto' : newSize,
    flexShrink,
    flexGrow
  };
}
