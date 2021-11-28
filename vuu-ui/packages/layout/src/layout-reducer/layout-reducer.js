import React from 'react';
import { Action } from '../layout-action';
import { findTarget, followPath, followPathToParent, getProp, getProps, typeOf } from '../utils';
import { isContainer } from '../registry/ComponentRegistry';
import {
  getInsertTabBeforeAfter,
  insertBesideChild,
  insertIntoContainer
} from './insert-layout-element';
import { wrap } from './wrap-layout-element';
import { removeChild } from './remove-layout-element';
import { resizeFlexChildren } from './resize-flex-children';
import { _replaceChild, replaceChild, swapChild } from './replace-layout-element';
import { getIntrinsicSize } from './flex-utils';

const MISSING_TYPE = undefined;

const MISSING_HANDLER = (state, action) => {
  console.warn(`layoutActionHandlers. No handler for action.type ${action.type}`);
  return state;
};

const MISSING_TYPE_HANDLER = (state) => {
  console.warn(`layoutActionHandlers. Invalid action:  missing attribute 'type'`);
  return state;
};

const handlers = {
  [Action.DRAG_DROP]: dragDrop,
  [Action.SPLITTER_RESIZE]: resizeFlexChildren,
  [Action.ADD]: addChild,
  [Action.REMOVE]: removeChild,
  [Action.REPLACE]: replaceChild,
  [Action.MAXIMIZE]: setChildProps,
  [Action.MINIMIZE]: setChildProps,
  [Action.RESTORE]: setChildProps,
  [Action.SWITCH_TAB]: switchTab,
  [Action.SET_TITLE]: setTitle,
  [MISSING_TYPE]: MISSING_TYPE_HANDLER
};

const layoutReducer = (state, action) => {
  return (handlers[action.type] || MISSING_HANDLER)(state, action);
};

export default layoutReducer;

function switchTab(state, { path, nextIdx }) {
  var target = followPath(state, path);
  let replacement;
  if (React.isValidElement(target)) {
    replacement = React.cloneElement(target, {
      active: nextIdx
    });
  } else {
    replacement = {
      ...target,
      active: nextIdx
    };
  }
  return swapChild(state, target, replacement);
}

function setTitle(state, { path, title }) {
  // could we just mutate here ?
  var target = followPath(state, path);
  let replacement;
  if (React.isValidElement(target)) {
    replacement = React.cloneElement(target, {
      title
    });
  } else {
    replacement = {
      ...target,
      title
    };
  }
  return swapChild(state, target, replacement);
}

function setChildProps(state, { path, type }) {
  var target = followPath(state, path);
  return swapChild(state, target, target, type);
}

function dragDrop(layoutRoot, action) {
  const { draggedReactElement: newComponent, dragInstructions, dropTarget } = action;
  const { component: existingComponent, pos } = dropTarget;

  const destinationTabstrip = pos.position.Header && typeOf(existingComponent) === 'Stack';
  const { id, version } = getProps(newComponent);
  const intrinsicSize = getIntrinsicSize(newComponent);

  let newLayoutRoot;
  if (destinationTabstrip) {
    const [targetTab, insertionPosition] = getInsertTabBeforeAfter(existingComponent, pos);
    if (targetTab === undefined) {
      newLayoutRoot = insertIntoContainer(layoutRoot, existingComponent, newComponent);
    } else {
      newLayoutRoot = insertBesideChild(layoutRoot, targetTab, newComponent, insertionPosition);
    }
  } else if (!intrinsicSize && pos.position.Centre) {
    newLayoutRoot = _replaceChild(layoutRoot, existingComponent, newComponent);
  } else {
    newLayoutRoot = dropLayoutIntoContainer(layoutRoot, dropTarget, newComponent);
  }

  // return newLayoutRoot

  if (dragInstructions.DoNotRemove) {
    return newLayoutRoot;
  } else {
    const finalTarget = findTarget(
      newLayoutRoot,
      (props) => props.id === id && props.version === version
    );
    const finalPath = getProp(finalTarget, 'path');
    return removeChild(newLayoutRoot, { path: finalPath });
  }
}

function addChild(rootProps, { path: containerPath, component }) {
  return insertIntoContainer(rootProps, followPath(rootProps, containerPath), component);
}

function dropLayoutIntoContainer(layoutRoot, dropTarget, newComponent) {
  const { component: existingComponent, pos, clientRect, dropRect } = dropTarget;
  const existingComponentPath = getProp(existingComponent, 'path');
  // In a Draggable layout, 0.n is the top-level layout
  if (existingComponent.path === '0.0' || existingComponentPath === '0.0') {
    return wrap(layoutRoot, existingComponent, newComponent, pos);
  } else {
    var targetContainer = followPathToParent(layoutRoot, existingComponentPath);

    if (withTheGrain(pos, targetContainer)) {
      const insertionPosition = pos.position.SouthOrEast ? 'after' : 'before';
      return insertBesideChild(
        layoutRoot,
        existingComponent,
        newComponent,
        insertionPosition,
        pos,
        clientRect,
        dropRect
      );
    } else if (!withTheGrain(pos, targetContainer)) {
      return wrap(layoutRoot, existingComponent, newComponent, pos, clientRect, dropRect);
    } else if (isContainer(targetContainer)) {
      return wrap(layoutRoot, existingComponent, newComponent, pos);
    } else {
      console.log('no support right now for position = ' + pos.position);
    }
  }

  return layoutRoot;
}

// Note: withTheGrain is not the negative of againstTheGrain - the difference lies in the
// handling of non-Flexible containers, the response for which is always false;
function withTheGrain(pos, container) {
  if (pos.position.Centre) {
    return isTerrace(container) || isTower(container);
  }

  return pos.position.NorthOrSouth
    ? isTower(container)
    : pos.position.EastOrWest
    ? isTerrace(container)
    : false;
}

function isTower(container) {
  return typeOf(container) === 'Flexbox' && container.props.style.flexDirection === 'column';
}

function isTerrace(container) {
  return typeOf(container) === 'Flexbox' && container.props.style.flexDirection !== 'column';
}
