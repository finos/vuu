import React, { ReactElement } from "react";
import { DropPos } from "../drag-drop/dragDropTypes";
import { DropTarget } from "../drag-drop/DropTarget";
import { isContainer } from "../registry/ComponentRegistry";
import {
  findTarget,
  followPath,
  followPathToParent,
  getProp,
  getProps,
  typeOf,
} from "../utils";
import { getIntrinsicSize } from "./flexUtils";
import {
  getInsertTabBeforeAfter,
  insertBesideChild,
  insertIntoContainer,
} from "./insert-layout-element";
import {
  AddAction,
  DragDropAction,
  LayoutActionType,
  LayoutReducerAction,
  MaximizeAction,
  SetTitleAction,
  SwitchTabAction,
} from "./layoutTypes";
import { LayoutProps } from "./layoutUtils";
import { removeChild } from "./remove-layout-element";
import {
  replaceChild,
  swapChild,
  _replaceChild,
} from "./replace-layout-element";
import { resizeFlexChildren } from "./resize-flex-children";
import { wrap } from "./wrap-layout-element";

export const layoutReducer = (
  state: ReactElement,
  action: LayoutReducerAction
): ReactElement => {
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
      return state;
  }
};

const switchTab = (state: ReactElement, { path, nextIdx }: SwitchTabAction) => {
  const target = followPath(state, path, true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const replacement = React.cloneElement<any>(target, {
    active: nextIdx,
  });
  return swapChild(state, target, replacement);
};

const setTitle = (state: ReactElement, { path, title }: SetTitleAction) => {
  debugger;
  const target = followPath(state, path, true);
  const replacement = React.cloneElement(target, {
    title,
  });
  return swapChild(state, target, replacement);
};

const setChildProps = (state: ReactElement, { path, type }: MaximizeAction) => {
  if (path) {
    const target = followPath(state, path, true);
    return swapChild(state, target, target, type);
  } else {
    return state;
  }
};

const dragDrop = (
  layoutRoot: ReactElement,
  action: DragDropAction
): ReactElement => {
  const {
    draggedReactElement: newComponent,
    dragInstructions,
    dropTarget,
  } = action;
  const existingComponent = dropTarget.component as ReactElement;
  const { pos } = dropTarget;
  const destinationTabstrip =
    pos?.position?.Header && typeOf(existingComponent) === "Stack";
  const { id, version } = getProps(newComponent);
  const intrinsicSize = getIntrinsicSize(newComponent);
  let newLayoutRoot: ReactElement;
  if (destinationTabstrip) {
    const [targetTab, insertionPosition] = getInsertTabBeforeAfter(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      existingComponent!,
      pos
    );
    if (targetTab === undefined) {
      newLayoutRoot = insertIntoContainer(
        layoutRoot,
        existingComponent,
        newComponent
      );
    } else {
      newLayoutRoot = insertBesideChild(
        layoutRoot,
        targetTab,
        newComponent,
        insertionPosition
      );
    }
  } else if (!intrinsicSize && pos?.position?.Centre) {
    newLayoutRoot = _replaceChild(
      layoutRoot,
      existingComponent as ReactElement,
      newComponent
    );
  } else {
    newLayoutRoot = dropLayoutIntoContainer(
      layoutRoot,
      dropTarget as DropTarget,
      newComponent
    );
  }

  if (dragInstructions.DoNotRemove) {
    return newLayoutRoot;
  }

  const finalTarget = findTarget(
    newLayoutRoot,
    (props: LayoutProps) => props.id === id && props.version === version
  ) as ReactElement;
  const finalPath = getProp(finalTarget, "path");
  return removeChild(newLayoutRoot, { path: finalPath, type: "remove" });
};

const addChild = (
  layoutRoot: ReactElement,
  { path: containerPath, component }: AddAction
) => {
  return insertIntoContainer(
    layoutRoot,
    followPath(layoutRoot, containerPath) as ReactElement,
    component
  );
};

const dropLayoutIntoContainer = (
  layoutRoot: ReactElement,
  dropTarget: DropTarget,
  newComponent: ReactElement
): ReactElement => {
  const {
    component: existingComponent,
    pos,
    clientRect,
    dropRect,
  } = dropTarget;
  const existingComponentPath = getProp(existingComponent, "path");

  if (existingComponentPath === "0.0") {
    return wrap(layoutRoot, existingComponent, newComponent, pos);
  }

  const targetContainer = followPathToParent(
    layoutRoot,
    existingComponentPath
  ) as ReactElement;

  if (withTheGrain(pos, targetContainer)) {
    const insertionPosition = pos.position.SouthOrEast ? "after" : "before";
    return insertBesideChild(
      layoutRoot,
      existingComponent,
      newComponent,
      insertionPosition,
      pos,
      clientRect,
      dropRect
    );
  }

  if (!withTheGrain(pos, targetContainer)) {
    return wrap(
      layoutRoot,
      existingComponent,
      newComponent,
      pos,
      clientRect,
      dropRect
    );
  }

  if (isContainer(typeOf(targetContainer) as string)) {
    return wrap(layoutRoot, existingComponent, newComponent, pos);
  }

  throw Error(`no support right now for position = ${pos.position}`);
};

const withTheGrain = (pos: DropPos, container: ReactElement) => {
  if (pos.position.Centre) {
    return isTerrace(container) || isTower(container);
  }

  return pos.position.NorthOrSouth
    ? isTower(container)
    : pos.position.EastOrWest
    ? isTerrace(container)
    : false;
};

const isTower = (container: ReactElement) => {
  return (
    typeOf(container) === "Flexbox" &&
    container.props.style.flexDirection === "column"
  );
};

const isTerrace = (container: ReactElement) => {
  return (
    typeOf(container) === "Flexbox" &&
    container.props.style.flexDirection !== "column"
  );
};
