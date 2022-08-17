import React, { ReactElement } from 'react';
import { createPlaceHolder } from './flex-utils';
import { swapChild } from './replace-layout-element';

import {
  followPath,
  followPathToParent,
  getProp,
  getProps,
  nextStep,
  resetPath,
  typeOf
} from '../utils';
import { LayoutModel, RemoveAction } from './layoutTypes';

export function removeChild(rootProps: LayoutModel, { path }: RemoveAction) {
  const target = followPath(rootProps, path) as ReactElement;
  let targetParent: LayoutModel | null | undefined = followPathToParent(
    rootProps,
    path
  ) as LayoutModel;
  const { children } = getProps(targetParent);
  if (children.length > 1 && allOtherChildrenArePlaceholders(children, path)) {
    // eslint-disable-next-line no-unused-vars
    const {
      style: { flexBasis, display, flexDirection, ...style }
    } = getProps(targetParent);
    let containerPath = getProp(targetParent, 'path');
    let newLayout = swapChild(
      rootProps,
      targetParent,
      createPlaceHolder(containerPath, flexBasis, style)
    );
    // eslint-disable-next-line no-cond-assign
    while ((targetParent = followPathToParent(newLayout, containerPath))) {
      if (getProp(targetParent, 'path') === '0') {
        break;
      }
      const { children } = getProps(targetParent);
      if (allOtherChildrenArePlaceholders(children)) {
        containerPath = getProp(targetParent, 'path');
        // eslint-disable-next-line no-unused-vars
        const {
          style: { flexBasis, display, flexDirection, ...style }
        } = getProps(targetParent);
        newLayout = swapChild(
          rootProps,
          targetParent,
          createPlaceHolder(containerPath, flexBasis, style)
        );
      } else if (hasAdjacentPlaceholders(children)) {
        newLayout = collapsePlaceholders(rootProps, targetParent as ReactElement);
        // } else if (hasRedundantPlaceholders(children)){
        /*
        We may have redundany placeholders for example where we have a tower  containing a Terrace and a placeholder
        If all the compinents bordering on the lower placeolder are themselves placeholders, the lower placeholder
        is redundant
      */
      } else {
        break;
      }
    }
    return newLayout;
    // return removeChild(rootProps, {path: targetParent.props.path});
    // return removeChildAndPlaceholder(rootProps, {path: targetParent.props.path});
  } else {
    return _removeChild(rootProps, target);
  }
}

function _removeChild(container: LayoutModel, child: ReactElement): LayoutModel {
  let { active, children: componentChildren, path, preserve } = getProps(container);
  const { idx, finalStep } = nextStep(path, getProp(child, 'path'));
  const type = typeOf(container) as string;
  let children = componentChildren.slice() as ReactElement[];
  if (finalStep) {
    children.splice(idx, 1);
    if (active !== undefined && active >= idx) {
      active = Math.max(0, active - 1);
    }

    if (children.length === 1 && !preserve && path !== '0' && type.match(/Flexbox|Stack/)) {
      return unwrap(container, children[0]);
    }

    // Not 100% sure we should do this, unless configured to
    if (!children.some(isFlexible) && children.some(canBeMadeFlexible)) {
      children = makeFlexible(children);
    }
  } else {
    children[idx] = _removeChild(children[idx], child) as ReactElement;
  }

  children = children.map((child, i) => resetPath(child, `${path}.${i}`));
  return React.isValidElement(container)
    ? React.cloneElement(container, { active }, children)
    : { ...container, active, children };
}

function unwrap(container: LayoutModel, child: ReactElement) {
  const type = typeOf(container);
  const {
    path,
    style: { flexBasis, flexGrow, flexShrink, width, height }
  } = getProps(container);

  let unwrappedChild = resetPath(child, path);
  if (path === '0') {
    unwrappedChild = React.cloneElement(unwrappedChild, {
      style: {
        ...child.props.style,
        width,
        height
      }
    });
  } else if (type === 'Flexbox') {
    const dim = container.props.style.flexDirection === 'column' ? 'height' : 'width';
    const {
      // eslint-disable-next-line no-unused-vars
      style: { [dim]: size, ...style }
    } = unwrappedChild.props;
    // Need to overwrite key
    unwrappedChild = React.cloneElement(unwrappedChild, {
      // Need to assign key
      flexFill: undefined,
      style: {
        ...style,
        // flexFill, if present described the childs relationship to the doomed flexbox,
        // must not be applied to new parent
        flexGrow,
        flexShrink,
        flexBasis,
        width,
        height
      }
    });
  }
  return unwrappedChild;
}

function isFlexible(model: LayoutModel) {
  return model.props.style.flexGrow > 0;
}

function canBeMadeFlexible(model: LayoutModel) {
  const { width, height, flexGrow } = model.props.style;
  return flexGrow === 0 && typeof width !== 'number' && typeof height !== 'number';
}

function makeFlexible(children: ReactElement[]) {
  return children.map((child) =>
    canBeMadeFlexible(child)
      ? React.cloneElement(child, {
          style: {
            ...child.props.style,
            flexGrow: 1
          }
        })
      : child
  );
}

const hasAdjacentPlaceholders = (children: ReactElement[]) => {
  if (children && children.length > 0) {
    let wasPlaceholder = getProp(children[0], 'placeholder');
    let isPlaceholder = false;
    for (let i = 1; i < children.length; i++) {
      isPlaceholder = getProp(children[i], 'placeholder');
      if (wasPlaceholder && isPlaceholder) {
        return true;
      }
      wasPlaceholder = isPlaceholder;
    }
  }
};

const collapsePlaceholders = (container: LayoutModel, target: ReactElement) => {
  let { children: componentChildren, path } = getProps(container);
  const { idx, finalStep } = nextStep(path, getProp(target, 'path'));
  let children = componentChildren.slice() as ReactElement[];
  if (finalStep) {
    children[idx] = _collapsePlaceHolders(target);
  } else {
    children[idx] = collapsePlaceholders(children[idx], target) as ReactElement;
  }

  children = children.map((child, i) => resetPath(child, `${path}.${i}`));
  return React.isValidElement(container)
    ? React.cloneElement(container, undefined, children)
    : { ...container, children };
};

const _collapsePlaceHolders = (container: ReactElement) => {
  const { children } = getProps(container);
  const newChildren = [];
  const placeholders: ReactElement[] = [];

  for (let i = 0; i < children.length; i++) {
    if (getProp(children[i], 'placeholder')) {
      placeholders.push(children[i]);
    } else {
      if (placeholders.length === 1) {
        newChildren.push(placeholders.pop());
      } else if (placeholders.length > 0) {
        newChildren.push(mergePlaceholders(placeholders));
        placeholders.length = 0;
      }
      newChildren.push(children[i]);
    }
  }

  if (placeholders.length === 1) {
    newChildren.push(placeholders.pop());
  } else if (placeholders.length > 0) {
    newChildren.push(mergePlaceholders(placeholders));
  }

  const containerPath = getProp(container, 'path');
  return React.cloneElement(
    container,
    undefined,
    newChildren.map((child, i) => resetPath(child, `${containerPath}.${i}`))
  );
};

const mergePlaceholders = ([placeholder, ...placeholders]: ReactElement[]) => {
  const targetStyle = getProp(placeholder, 'style');
  let { flexBasis, flexGrow, flexShrink } = targetStyle;
  for (let {
    props: { style }
  } of placeholders) {
    flexBasis += style.flexBasis;
    flexGrow = Math.max(flexGrow, style.flexGrow);
    flexShrink = Math.max(flexShrink, style.flexShrink);
  }
  return React.cloneElement(placeholder, {
    style: { ...targetStyle, flexBasis, flexGrow, flexShrink }
  });
};

const allOtherChildrenArePlaceholders = (children: ReactElement[], path?: string) =>
  children.every(
    (child) => getProp(child, 'placeholder') || (path && getProp(child, 'path') === path)
  );
