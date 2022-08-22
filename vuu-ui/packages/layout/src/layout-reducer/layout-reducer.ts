import React, { ReactElement } from 'react';
import { isContainer } from '../registry/ComponentRegistry';
import { findTarget, followPath, followPathToParent, getProp, getProps, typeOf } from '../utils';
import { getIntrinsicSize } from './flex-utils';
import {
  getInsertTabBeforeAfter,
  insertBesideChild,
  insertIntoContainer
} from './insert-layout-element';
import {
  AddAction,
  DragDropAction,
  LayoutReducerAction,
  LayoutActionType,
  LayoutModel,
  LayoutRoot,
  SetTitleAction,
  SwitchTabAction,
  MaximizeAction
} from './layoutTypes';
import { LayoutProps } from './layoutUtils';
import { removeChild } from './remove-layout-element';
import { replaceChild, swapChild, _replaceChild } from './replace-layout-element';
import { resizeFlexChildren } from './resize-flex-children';
import { wrap } from './wrap-layout-element';
import { DropPos } from '../drag-drop/dragDropTypes';
import { DropTarget } from '../drag-drop/DropTarget';

// const handlers: Handlers = {
// [Action.MAXIMIZE]: setChildProps,
// [Action.MINIMIZE]: setChildProps,
// [Action.RESTORE]: setChildProps,
// };

export const layoutReducer = (state: LayoutModel, action: LayoutReducerAction): LayoutModel => {
  console.log({ action, state });
  switch (action.type) {
    case LayoutActionType.ADD:
      return addChild(state, action);
    case LayoutActionType.DRAG_DROP:
      return dragDrop(state, action);
    case LayoutActionType.MAXIMIZE:
      return setChildProps(state, action);
    case LayoutActionType.REMOVE:
      return removeChild(state, action);
    case LayoutActionType.REPLACE:
      return replaceChild(state, action);
    case LayoutActionType.SET_TITLE:
      return setTitle(state, action);
    case LayoutActionType.SPLITTER_RESIZE:
      return resizeFlexChildren(state, action);
    case LayoutActionType.SWITCH_TAB:
      return switchTab(state, action);
    default:
      console.warn(`layoutActionHandlers. No handler for action.type ${(action as any).type}`);
      return state;
  }
};

function switchTab(state: LayoutModel, { path, nextIdx }: SwitchTabAction) {
  var target = followPath(state, path);
  if (target) {
    let replacement;
    if (React.isValidElement(target)) {
      replacement = React.cloneElement<any>(target, {
        active: nextIdx
      });
    } else {
      replacement = {
        ...target,
        active: nextIdx
      };
    }
    return swapChild(state, target, replacement);
  } else {
    return state;
  }
}

function setTitle(state: LayoutModel, { path, title }: SetTitleAction) {
  // could we just mutate here ?
  var target = followPath(state, path) as LayoutModel;
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

function setChildProps(state: LayoutModel, { path, type }: MaximizeAction) {
  var target = followPath(state, path) as LayoutModel;
  return swapChild(state, target, target, type);
}

function dragDrop(layoutRoot: LayoutModel, action: DragDropAction) {
  console.log(`DragDrop`, { action });
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
    newLayoutRoot = _replaceChild(layoutRoot, existingComponent as ReactElement, newComponent);
  } else {
    newLayoutRoot = dropLayoutIntoContainer(layoutRoot, dropTarget, newComponent);
  }

  // return newLayoutRoot

  if (dragInstructions.DoNotRemove) {
    return newLayoutRoot;
  } else {
    const finalTarget = findTarget(
      newLayoutRoot,
      (props: LayoutProps) => props.id === id && props.version === version
    ) as LayoutModel;
    const finalPath = getProp(finalTarget, 'path');
    return removeChild(newLayoutRoot, { path: finalPath, type: 'remove' });
  }
}

function addChild(layoutRoot: LayoutModel, { path: containerPath, component }: AddAction) {
  return insertIntoContainer(
    layoutRoot,
    followPath(layoutRoot, containerPath) as ReactElement,
    component
  ) as LayoutRoot;
}

function dropLayoutIntoContainer(
  layoutRoot: LayoutModel,
  dropTarget: DropTarget,
  newComponent: any
) {
  const { component: existingComponent, pos, clientRect, dropRect } = dropTarget;
  const existingComponentPath = getProp(existingComponent, 'path');
  // In a Draggable layout, 0.n is the top-level layout
  if (/* existingComponent.path === '0.0' || */ existingComponentPath === '0.0') {
    return wrap(layoutRoot, existingComponent, newComponent, pos);
  } else {
    var targetContainer = followPathToParent(layoutRoot, existingComponentPath) as LayoutModel;

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
    } else if (isContainer(typeOf(targetContainer) as string)) {
      return wrap(layoutRoot, existingComponent, newComponent, pos);
    } else {
      console.log('no support right now for position = ' + pos.position);
    }
  }

  return layoutRoot;
}

// Note: withTheGrain is not the negative of againstTheGrain - the difference lies in the
// handling of non-Flexible containers, the response for which is always false;
function withTheGrain(pos: DropPos, container: LayoutModel) {
  if (pos.position.Centre) {
    return isTerrace(container) || isTower(container);
  }

  return pos.position.NorthOrSouth
    ? isTower(container)
    : pos.position.EastOrWest
    ? isTerrace(container)
    : false;
}

function isTower(container: LayoutModel) {
  return typeOf(container) === 'Flexbox' && container.props.style.flexDirection === 'column';
}

function isTerrace(container: LayoutModel) {
  return typeOf(container) === 'Flexbox' && container.props.style.flexDirection !== 'column';
}
