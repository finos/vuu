import React from 'react';
import { uuid } from '@vuu-ui/utils';
import { getManagedDimension } from '../layoutUtils';
import { getProp, getProps, nextStep, resetPath, typeOf } from '../utils';
import {
  createPlaceHolder,
  getFlexDimensions,
  getFlexOrIntrinsicStyle,
  getIntrinsicSize,
  wrapIntrinsicSizeComponentWithFlexbox
} from './flex-utils';

export function getInsertTabBeforeAfter(stack, pos) {
  const tabs = stack.props.children;
  const tabCount = tabs.length;
  const { index, positionRelativeToTab = 'after' } = pos.tab;
  return index === -1 || index >= tabCount
    ? [tabs[tabCount - 1], 'after']
    : [tabs[index] ?? null, positionRelativeToTab];
}

export function insertIntoContainer(container, targetContainer, newComponent) {
  const {
    active: containerActive,
    children: containerChildren,
    path: containerPath
  } = getProps(container);

  const existingComponentPath = getProp(targetContainer, 'path');
  const { idx, finalStep } = nextStep(containerPath, existingComponentPath, true);
  const [insertedIdx, children] = finalStep
    ? insertIntoChildren(container, containerChildren, idx, newComponent)
    : [
        containerActive,
        containerChildren.map((child, index) =>
          index === idx ? insertIntoContainer(child, targetContainer, newComponent) : child
        )
      ];
  const active = typeOf(container) === 'Stack' ? insertedIdx : containerActive;
  return React.isValidElement(container)
    ? React.cloneElement(container, { active }, children)
    : {
        ...container,
        active,
        children
      };
}
function insertIntoChildren(container, containerChildren, idx, newComponent) {
  const containerPath = getProp(container, 'path');
  const count = containerChildren?.length;
  const { id = uuid() } = getProps(newComponent);

  if (count) {
    return [
      count,
      containerChildren.concat(resetPath(newComponent, `${containerPath}.${count}`, { id }))
    ];
  } else {
    console.log(`new component`, newComponent);
    return [0, [resetPath(newComponent, `${containerPath}.0`, { id })]];
  }
}

export function insertBesideChild(
  container,
  existingComponent,
  newComponent,
  insertionPosition,
  pos,
  clientRect,
  dropRect
) {
  const {
    active: containerActive,
    children: containerChildren,
    path: containerPath
  } = getProps(container);

  const existingComponentPath = getProp(existingComponent, 'path');
  const { idx, finalStep } = nextStep(containerPath, existingComponentPath);
  const [insertedIdx, children] = finalStep
    ? updateChildren(
        container,
        containerChildren,
        idx,
        newComponent,
        insertionPosition,
        pos,
        clientRect,
        dropRect
      )
    : [
        containerActive,
        containerChildren.map((child, index) =>
          index === idx
            ? insertBesideChild(
                child,
                existingComponent,
                newComponent,
                insertionPosition,
                pos,
                clientRect,
                dropRect
              )
            : child
        )
      ];

  const active = typeOf(container) === 'Stack' ? insertedIdx : containerActive;
  return React.isValidElement(container)
    ? React.cloneElement(container, { active }, children)
    : {
        ...container,
        active,
        children
      };
}

function updateChildren(
  container,
  containerChildren,
  idx,
  newComponent,
  insertionPosition,
  pos,
  clientRect,
  dropRect
) {
  const intrinsicSize = getIntrinsicSize(newComponent);
  if (intrinsicSize?.width && intrinsicSize?.height) {
    return insertIntrinsicSizedComponent(
      container,
      containerChildren,
      idx,
      newComponent,
      insertionPosition,
      clientRect,
      dropRect
    );
  } else {
    return insertFlexComponent(
      container,
      containerChildren,
      idx,
      newComponent,
      insertionPosition,
      pos?.width || pos?.height,
      clientRect
    );
  }
}

const getLeadingPlaceholderSize = (
  flexDirection,
  insertionPosition,
  { top, right, bottom, left },
  [rectLeft, rectTop, rectRight, rectBottom]
) => {
  if (flexDirection === 'column' && insertionPosition === 'before') {
    return rectTop - top;
  } else if (flexDirection === 'column') {
    return bottom - rectBottom;
  } else if (flexDirection === 'row' && insertionPosition === 'before') {
    return rectLeft - left;
  } else if (flexDirection === 'row') {
    return right - rectRight;
  }
};

function insertIntrinsicSizedComponent(
  container,
  containerChildren,
  idx,
  newComponent,
  insertionPosition,
  clientRect,
  dropRect
) {
  const {
    style: { flexDirection }
  } = getProps(container);
  const [dimension, crossDimension, contraDirection] = getFlexDimensions(flexDirection);
  const { [crossDimension]: intrinsicCrossSize, [dimension]: intrinsicSize } =
    getIntrinsicSize(newComponent);
  const path = getProp(containerChildren[idx], 'path');

  // If we are introducing a new item into a row/column, but it is not flush against existing child, we will insert
  // a leading placeholder ...
  const placeholderSize = getLeadingPlaceholderSize(
    flexDirection,
    insertionPosition,
    clientRect,
    dropRect
  );

  const [itemToInsert, size] =
    intrinsicCrossSize < clientRect[crossDimension]
      ? [
          wrapIntrinsicSizeComponentWithFlexbox(
            newComponent,
            contraDirection,
            path,
            clientRect,
            dropRect
          ),
          intrinsicSize
        ]
      : [newComponent, undefined];

  const placeholder = placeholderSize
    ? createPlaceHolder(path, placeholderSize, { flexGrow: 0, flexShrink: 0 })
    : undefined;

  if (intrinsicCrossSize > clientRect[crossDimension]) {
    containerChildren = containerChildren.map((child) => {
      if (getProp(child, 'placeholder')) {
        return child;
      } else {
        const { [crossDimension]: intrinsicCrossChildSize } = getIntrinsicSize(child);
        if (intrinsicCrossChildSize && intrinsicCrossChildSize < intrinsicCrossSize) {
          return wrapIntrinsicSizeComponentWithFlexbox(
            child,
            contraDirection,
            getProp(child, 'path')
          );
        } else {
          return child;
        }
      }
    });
  }

  return insertFlexComponent(
    container,
    containerChildren,
    idx,
    itemToInsert,
    insertionPosition,
    size,
    clientRect,
    placeholder
  );
}

function insertFlexComponent(
  container,
  containerChildren,
  idx,
  newComponent,
  insertionPosition,
  size,
  targetRect,
  placeholder
) {
  const containerPath = getProp(container, 'path');
  let insertedIdx = 0;
  const children =
    !containerChildren || containerChildren.length === 0
      ? [newComponent]
      : containerChildren
          .reduce((arr, child, i) => {
            if (idx === i) {
              const [existingComponent, insertedComponent] = getStyledComponents(
                container,
                child,
                newComponent,
                targetRect
              );
              if (insertionPosition === 'before') {
                if (placeholder) {
                  arr.push(placeholder, insertedComponent, existingComponent);
                } else {
                  arr.push(insertedComponent, existingComponent);
                }
              } else {
                if (placeholder) {
                  arr.push(existingComponent, insertedComponent, placeholder);
                } else {
                  arr.push(existingComponent, insertedComponent);
                }
              }
              insertedIdx = arr.indexOf(insertedComponent);
            } else {
              arr.push(child);
            }
            return arr;
          }, [])
          .map((child, i) => (i < insertedIdx ? child : resetPath(child, `${containerPath}.${i}`)));

  return [insertedIdx, children];
}

function getStyledComponents(container, existingComponent, newComponent, targetRect) {
  let { id = uuid(), version = 0 } = getProps(newComponent);
  version += 1;
  if (typeOf(container) === 'Flexbox') {
    const [dim] = getManagedDimension(container.props.style);
    const splitterSize = 6;
    const size = { [dim]: (targetRect[dim] - splitterSize) / 2 };
    const existingComponentStyle = getFlexOrIntrinsicStyle(existingComponent, dim, size);
    const newComponentStyle = getFlexOrIntrinsicStyle(newComponent, dim, size);

    return [
      React.cloneElement(existingComponent, {
        style: existingComponentStyle
      }),
      React.cloneElement(newComponent, { id, version, style: newComponentStyle })
    ];
  } else {
    const { style: { left: _1, top: _2, flex: _3, ...style } = {} } = getProps(newComponent);
    // TODO why would we strip out width, height if resizeable
    // we might need these if in a Stack, for example
    // const dimensions = source.props.resizeable ? {} : { width, height };
    return [existingComponent, React.cloneElement(newComponent, { id, version, style })];
  }
}
