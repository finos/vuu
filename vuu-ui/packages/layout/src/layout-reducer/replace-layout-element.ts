import React, { ReactElement } from 'react';
import { getProp, getProps, nextStep } from '../utils';
import { Action } from '../layout-action';
import { applyLayoutProps, LayoutProps } from './layoutUtils';
import { LayoutModel, LayoutRoot, ReplaceAction } from './layoutTypes';

export function replaceChild(model: LayoutModel, { target, replacement }: ReplaceAction) {
  return _replaceChild(model, target, replacement);
}

export function _replaceChild(
  model: LayoutModel,
  child: ReactElement,
  replacement: ReactElement<LayoutProps> | LayoutProps
) {
  const path = getProp(child, 'path');
  const resizeable = getProp(child, 'resizeable');
  const { style } = getProps(child);
  const newChild = React.isValidElement(replacement)
    ? // applyLayoutProps is a bit heavy here - it supports the scenario
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
      )
    : {
        ...replacement,
        path,
        resizeable,
        style: {
          ...style,
          ...replacement.style
        }
      };

  return swapChild(model, child, newChild);
}

export function swapChild(
  model: LayoutModel,
  child: LayoutModel,
  replacement: LayoutModel | LayoutProps,
  op?: 'maximize' | 'minimize' | 'restore'
): LayoutModel {
  if (model === child) {
    return replacement as any;
  } else {
    if (React.isValidElement(model)) {
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
    } else {
      const { idx, finalStep } = nextStep(getProp(model, 'path'), getProp(child, 'path'));

      let children;
      if (finalStep && React.isValidElement((model as LayoutRoot).children)) {
        children = replacement;
      } else {
        children = (model as LayoutRoot).children!.slice();
        if (finalStep) {
          children[idx] = replacement as ReactElement;
        } else {
          children[idx] = swapChild(children[idx], child, replacement, op) as ReactElement;
        }
      }
      return { ...model, children } as any;
    }
  }
}

function minimize(parent: LayoutModel, child: ReactElement) {
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
