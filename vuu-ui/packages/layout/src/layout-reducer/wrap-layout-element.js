import React from 'react';
import { uuid } from '@vuu-ui/utils';
import { getProp, getProps, nextStep, resetPath, typeOf } from '../utils';
import { ComponentRegistry } from '../registry/ComponentRegistry';
import {
  createFlexbox,
  createPlaceHolder,
  getFlexStyle,
  getIntrinsicSize,
  wrapIntrinsicSizeComponentWithFlexbox
} from './flex-utils';
import { applyLayoutProps } from '../layoutUtils';

const isHtmlElement = (component) => {
  const [firstLetter] = typeOf(component);
  return firstLetter === firstLetter.toLowerCase();
};

// newComponent has been dropped onto an existingComponent. A wrapper container will be inserted
// into the layout tree, wrapping the existingComponent. newComponent will be injected into the
// new wrapper, so existingComponent and newComponent will be siblings. Putting it another way,
// wrapper will replace existingComponent in the layout tree and it will contain existingComponent
// and newComponent.
export function wrap(container, existingComponent, newComponent, pos, clientRect, dropRect) {
  const { children: containerChildren, path: containerPath } = getProps(container);

  const existingComponentPath = getProp(existingComponent, 'path');
  const { idx, finalStep } = nextStep(containerPath, existingComponentPath);
  const children = finalStep
    ? updateChildren(
        container,
        containerChildren,
        existingComponent,
        newComponent,
        pos,
        clientRect,
        dropRect
      )
    : containerChildren.map((child, index) =>
        index === idx
          ? wrap(child, existingComponent, newComponent, pos, clientRect, dropRect)
          : child
      );

  return React.isValidElement(container)
    ? React.cloneElement(container, null, children)
    : {
        ...container,
        children
      };
}

function updateChildren(
  container,
  containerChildren,
  existingComponent,
  newComponent,
  pos,
  clientRect,
  dropRect
) {
  const intrinsicSize = getIntrinsicSize(newComponent);

  if (intrinsicSize?.width && intrinsicSize?.height) {
    return wrapIntrinsicSizedComponent(
      containerChildren,
      existingComponent,
      newComponent,
      pos,
      clientRect,
      dropRect
    );
  } else {
    return wrapFlexComponent(container, containerChildren, existingComponent, newComponent, pos);
  }
}

function wrapFlexComponent(container, containerChildren, existingComponent, newComponent, pos) {
  const { version = 0 } = getProps(newComponent);
  const existingComponentPath = getProp(existingComponent, 'path');
  const { type, flexDirection, showTabs: showTabsProp } = getLayoutSpecForWrapper(pos);
  const [style, existingComponentStyle, newComponentStyle] = getWrappedFlexStyles(
    type,
    existingComponent,
    newComponent,
    flexDirection,
    pos
  );
  const targetFirst = isTargetFirst(pos);
  const active = targetFirst ? 1 : 0; // double check this

  // TODO how do we decide whether children should be resizable ?
  const newComponentProps = { resizeable: true, style: newComponentStyle, version: version + 1 };
  const resizeProp = isHtmlElement(existingComponent) ? 'data-resizeable' : 'resizeable';
  const existingComponentProps = { [resizeProp]: true, style: existingComponentStyle };

  const showTabs = type === 'Stack' ? { showTabs: showTabsProp } : undefined;
  const splitterSize =
    type === 'Flexbox'
      ? {
          splitterSize:
            (typeOf(container) === 'Flexbox' && container.props.splitterSize) ?? undefined
        }
      : undefined;

  const id = uuid();
  var wrapper = React.createElement(
    ComponentRegistry[type],
    {
      active,
      id,
      key: id,
      path: getProp(existingComponent, 'path'),
      flexFill: getProp(existingComponent, 'flexFill'),
      // TODO we should be able to configure this in setDefaultLayoutProps
      ...splitterSize,
      ...showTabs,
      style,
      resizeable: getProp(existingComponent, 'resizeable')
    },
    targetFirst
      ? [
          resetPath(existingComponent, `${existingComponentPath}.0`, existingComponentProps),
          // resetPath(newComponent, `${existingComponentPath}.1`, newComponentProps),
          applyLayoutProps(
            React.cloneElement(newComponent, newComponentProps),
            `${existingComponentPath}.1`
          )
        ]
      : [
          applyLayoutProps(
            React.cloneElement(newComponent, newComponentProps),
            `${existingComponentPath}.0`
          ),
          // resetPath(newComponent, `${existingComponentPath}.0`, newComponentProps),
          resetPath(existingComponent, `${existingComponentPath}.1`, existingComponentProps)
        ]
  );
  return containerChildren.map((child) => (child === existingComponent ? wrapper : child));
}

function wrapIntrinsicSizedComponent(
  containerChildren,
  existingComponent,
  newComponent,
  pos,
  clientRect,
  dropRect
) {
  const { flexDirection } = getLayoutSpecForWrapper(pos);
  const contraDirection = flexDirection === 'column' ? 'row' : 'column';
  const targetFirst = isTargetFirst(pos);

  const [dropLeft, dropTop, dropRight, dropBottom] = dropRect;
  const [startPlaceholder, endPlaceholder] =
    flexDirection === 'column'
      ? [dropTop - clientRect.top, clientRect.bottom - dropBottom]
      : [dropLeft - clientRect.left, clientRect.right - dropRight];
  const pathRoot = getProp(existingComponent, 'path');
  let pathIndex = 0;

  const resizeProp = isHtmlElement(existingComponent) ? 'data-resizeable' : 'resizeable';

  const wrappedChildren = [];
  if (startPlaceholder) {
    wrappedChildren.push(
      targetFirst
        ? resetPath(existingComponent, `${pathRoot}.${pathIndex++}`, {
            [resizeProp]: true,
            style: { flexBasis: startPlaceholder, flexGrow: 1, flexShrink: 1 }
          })
        : createPlaceHolder(`${pathRoot}.${pathIndex++}`, startPlaceholder, {
            flexGrow: 0,
            flexShrink: 0
          })
    );
  }
  wrappedChildren.push(
    wrapIntrinsicSizeComponentWithFlexbox(
      newComponent,
      contraDirection,
      `${pathRoot}.${pathIndex++}`,
      clientRect,
      dropRect
    )
  );
  if (endPlaceholder) {
    wrappedChildren.push(
      targetFirst
        ? createPlaceHolder(`${pathRoot}.${pathIndex++}`, 0)
        : resetPath(existingComponent, `${pathRoot}.${pathIndex++}`, {
            [resizeProp]: true,
            style: { flexBasis: 0, flexGrow: 1, flexShrink: 1 }
          })
    );
  }

  const wrapper = createFlexbox(flexDirection, existingComponent.props, wrappedChildren, pathRoot);
  return containerChildren.map((child) => (child === existingComponent ? wrapper : child));
}

//TODO we need to respect styles on the source, full-on flex might not be appropriate
function getWrappedFlexStyles(type, existingComponent, newComponent, flexDirection, pos) {
  const style = {
    ...existingComponent.props.style,
    flexDirection
  };

  const dimension = type === 'Flexbox' && flexDirection === 'column' ? 'height' : 'width';
  const newComponentStyle = getFlexStyle(newComponent, dimension, pos);
  const existingComponentStyle = getFlexStyle(existingComponent, dimension);

  return [style, existingComponentStyle, newComponentStyle];
}

const isTargetFirst = (pos) =>
  pos.position.SouthOrEast
    ? true
    : pos?.tab?.positionRelativeToTab === 'before'
    ? false
    : pos.position.Header
    ? true
    : false;

function getLayoutSpecForWrapper(pos) {
  let type, flexDirection, showTabs;

  if (pos.position.Header) {
    type = 'Stack';
    flexDirection = 'column';
    showTabs = true;
  } else {
    type = 'Flexbox';
    if (pos.position.EastOrWest) {
      flexDirection = 'row';
    } else {
      flexDirection = 'column';
    }
  }

  return { type, flexDirection, showTabs };
}
