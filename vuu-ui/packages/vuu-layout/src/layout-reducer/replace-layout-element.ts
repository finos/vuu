import React, { ReactElement } from 'react';
import { getProp, getProps, nextStep } from '../utils';
import { Action } from '../layout-action';
import { applyLayoutProps, LayoutProps } from './layoutUtils';
import { ReplaceAction } from './layoutTypes';

export function replaceChild(model: ReactElement, { target, replacement }: ReplaceAction) {
  return _replaceChild(model, target, replacement);
}

export function _replaceChild(
  model: ReactElement,
  child: ReactElement,
  replacement: ReactElement<LayoutProps>
) {
  const path = getProp(child, 'path');
  const resizeable = getProp(child, 'resizeable');
  const { style } = getProps(child);
  const newChild =
    // applyLayoutProps is a bit heavy here - it supports the scenario
    // where we drop/replace a template. Might want to make it somehow
    // an opt-in option
    applyLayoutProps(
      React.cloneElement(replacement, {
        resizeable,
        style: {
          ...style,
          ...replacement.props.style
        }
      }),
      path
    );

  return swapChild(model, child, newChild);
}

export function swapChild(
  model: ReactElement,
  child: ReactElement,
  replacement: ReactElement,
  op?: 'maximize' | 'minimize' | 'restore'
): ReactElement {
  if (model === child) {
    return replacement as any;
  } else {
    const { idx, finalStep } = nextStep(getProp(model, 'path'), getProp(child, 'path'));
    const children = model.props.children.slice();
    if (finalStep) {
      if (!op) {
        children[idx] = replacement;
      } else if (op === Action.MINIMIZE) {
        children[idx] = minimize(model, children[idx]);
      } else if (op === Action.RESTORE) {
        children[idx] = restore(children[idx]);
      }
    } else {
      children[idx] = swapChild(children[idx], child, replacement, op);
    }
    return React.cloneElement(model, undefined, children);
  }
}

function minimize(parent: ReactElement, child: ReactElement) {
  // Right now, parent is always going to be a FLexbox, but might not always be the case
  const { style: parentStyle } = getProps(parent);
  const { style: childStyle } = getProps(child);

  const { width, height, flexBasis, flexShrink, flexGrow, ...rest } = childStyle;

  const restoreStyle = {
    width,
    height,
    flexBasis,
    flexShrink,
    flexGrow
  };

  const style = {
    ...rest,
    flexBasis: 0,
    flexGrow: 0,
    flexShrink: 0
  };
  const collapsed =
    parentStyle.flexDirection === 'row'
      ? 'vertical'
      : parentStyle.flexDirection === 'column'
      ? 'horizontal'
      : false;

  if (collapsed) {
    return React.cloneElement(child, {
      collapsed,
      restoreStyle,
      style
    });
  } else {
    return child;
  }
}

function restore(child: ReactElement) {
  // Right now, parent is always going to be a FLexbox, but might not always be the case
  const { style: childStyle, restoreStyle } = getProps(child);

  const { flexBasis, flexShrink, flexGrow, ...rest } = childStyle;

  const style = {
    ...rest,
    ...restoreStyle
  };

  return React.cloneElement(child, {
    collapsed: false,
    style,
    restoreStyle: undefined
  });
}
