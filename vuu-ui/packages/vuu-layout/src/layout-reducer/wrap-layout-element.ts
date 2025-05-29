/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getLayoutComponent,
  LayoutModel,
  rectTuple,
  uuid,
} from "@vuu-ui/vuu-utils";
import React, { ReactElement } from "react";
import { DropPos } from "../drag-drop/dragDropTypes";
import { DropTarget } from "../drag-drop/DropTarget";
import { getProp, getProps, nextStep, resetPath, typeOf } from "../utils";
import {
  createFlexbox,
  createPlaceHolder,
  flexDirection,
  getFlexStyle,
  getIntrinsicSize,
  wrapIntrinsicSizeComponentWithFlexbox,
} from "./flexUtils";
import { applyLayoutProps, LayoutProps } from "./layoutUtils";

export interface LayoutSpec {
  type: "Stack" | "Flexbox";
  flexDirection: "column" | "row";
  showTabs?: boolean;
}

const isHtmlElement = (component: LayoutModel) => {
  const [firstLetter] = typeOf(component) as string;
  return firstLetter === firstLetter.toLowerCase();
};

export function wrap(
  container: ReactElement,
  existingComponent: ReactElement,
  newComponent: any,
  pos: DropPos,
  clientRect?: DropTarget["clientRect"],
  dropRect?: DropTarget["dropRect"],
): ReactElement {
  const { children: containerChildren, path: containerPath } =
    getProps(container);

  const existingComponentPath = getProp(existingComponent, "path");
  const { idx, finalStep } = nextStep(containerPath, existingComponentPath);
  const children = finalStep
    ? updateChildren(
        container,
        containerChildren,
        existingComponent,
        newComponent,
        pos,
        clientRect,
        dropRect,
      )
    : containerChildren.map((child: ReactElement, index: number) =>
        index === idx
          ? wrap(
              child,
              existingComponent,
              newComponent,
              pos,
              clientRect,
              dropRect,
            )
          : child,
      );

  return React.cloneElement(container, undefined, children);
}

function updateChildren(
  container: LayoutModel,
  containerChildren: ReactElement[],
  existingComponent: ReactElement,
  newComponent: ReactElement,
  pos: DropPos,
  clientRect?: DropTarget["clientRect"],
  dropRect?: rectTuple,
) {
  const intrinsicSize = getIntrinsicSize(newComponent);

  if (intrinsicSize?.width && intrinsicSize?.height) {
    if (clientRect === undefined || dropRect === undefined) {
      throw Error(
        "wrap-layout-element, updateChildren clientRect and dropRect must both be available",
      );
    }
    return wrapIntrinsicSizedComponent(
      containerChildren,
      existingComponent,
      newComponent,
      pos,
      clientRect,
      dropRect,
    );
  }
  return wrapFlexComponent(
    container,
    containerChildren,
    existingComponent,
    newComponent,
    pos,
  );
}

function wrapFlexComponent(
  container: LayoutModel,
  containerChildren: ReactElement[],
  existingComponent: ReactElement,
  newComponent: ReactElement,
  pos: DropPos,
) {
  const { version = 0 } = getProps(newComponent);
  const { path: existingComponentPath, title } = getProps(existingComponent);
  const {
    type,
    flexDirection,
    showTabs: showTabsProp,
  } = getLayoutSpecForWrapper(pos);
  const [style, existingComponentStyle, newComponentStyle] =
    getWrappedFlexStyles(
      type,
      existingComponent,
      newComponent,
      flexDirection,
      pos,
    );
  const targetFirst = isTargetFirst(pos);
  const active = targetFirst ? 1 : 0;

  const newComponentProps = {
    resizeable: true,
    style: newComponentStyle,
    version: version + 1,
  };
  const resizeProp = isHtmlElement(existingComponent)
    ? "data-resizeable"
    : "resizeable";

  const existingComponentProps = {
    [resizeProp]: true,
    style: existingComponentStyle,
  };

  const showTabs = type === "Stack" ? { showTabs: showTabsProp } : undefined;
  const splitterSize =
    type === "Flexbox"
      ? {
          splitterSize:
            (typeOf(container) === "Flexbox" && container.props.splitterSize) ??
            undefined,
        }
      : undefined;

  const id = uuid();
  const wrapper = React.createElement(
    getLayoutComponent(type),
    {
      active,
      id,
      key: id,
      path: getProp(existingComponent, "path"),
      flexFill: getProp(existingComponent, "flexFill"),
      ...splitterSize,
      ...showTabs,
      style,
      title,
      resizeable: getProp(existingComponent, "resizeable"),
    } as LayoutProps,
    targetFirst
      ? [
          resetPath(
            existingComponent,
            `${existingComponentPath}.0`,
            existingComponentProps,
          ),
          applyLayoutProps(
            React.cloneElement(newComponent, newComponentProps),
            `${existingComponentPath}.1`,
          ),
        ]
      : [
          applyLayoutProps(
            React.cloneElement(newComponent, newComponentProps),
            `${existingComponentPath}.0`,
          ),
          resetPath(
            existingComponent,
            `${existingComponentPath}.1`,
            existingComponentProps,
          ),
        ],
  );
  return containerChildren.map((child: ReactElement) =>
    child === existingComponent ? wrapper : child,
  );
}

function wrapIntrinsicSizedComponent(
  containerChildren: ReactElement[],
  existingComponent: ReactElement,
  newComponent: ReactElement,
  pos: DropPos,
  clientRect: DropTarget["clientRect"],
  dropRect: rectTuple,
) {
  const { flexDirection } = getLayoutSpecForWrapper(pos);
  const contraDirection = flexDirection === "column" ? "row" : "column";
  const targetFirst = isTargetFirst(pos);

  const [dropLeft, dropTop, dropRight, dropBottom] = dropRect;
  const [startPlaceholder, endPlaceholder] =
    flexDirection === "column"
      ? [dropTop - clientRect.top, clientRect.bottom - dropBottom]
      : [dropLeft - clientRect.left, clientRect.right - dropRight];
  const pathRoot = getProp(existingComponent, "path");
  let pathIndex = 0;

  const resizeProp = isHtmlElement(existingComponent)
    ? "data-resizeable"
    : "resizeable";

  const wrappedChildren = [];
  if (startPlaceholder) {
    wrappedChildren.push(
      targetFirst
        ? resetPath(existingComponent, `${pathRoot}.${pathIndex++}`, {
            [resizeProp]: true,
            style: { flexBasis: startPlaceholder, flexGrow: 1, flexShrink: 1 },
          })
        : createPlaceHolder(`${pathRoot}.${pathIndex++}`, startPlaceholder, {
            flexGrow: 0,
            flexShrink: 0,
          }),
    );
  }
  wrappedChildren.push(
    wrapIntrinsicSizeComponentWithFlexbox(
      newComponent,
      contraDirection,
      `${pathRoot}.${pathIndex++}`,
      clientRect,
      dropRect,
    ),
  );
  if (endPlaceholder) {
    wrappedChildren.push(
      targetFirst
        ? createPlaceHolder(`${pathRoot}.${pathIndex++}`, 0)
        : resetPath(existingComponent, `${pathRoot}.${pathIndex++}`, {
            [resizeProp]: true,
            style: { flexBasis: 0, flexGrow: 1, flexShrink: 1 },
          }),
    );
  }

  const wrapper = createFlexbox(
    flexDirection,
    existingComponent.props,
    wrappedChildren,
    pathRoot,
  );
  return containerChildren.map((child) =>
    child === existingComponent ? wrapper : child,
  );
}

function getWrappedFlexStyles(
  type: string,
  existingComponent: ReactElement,
  newComponent: ReactElement,
  flexDirection: flexDirection,
  pos: DropPos,
) {
  const style = {
    ...existingComponent.props.style,
    flexDirection,
  };

  const dimension =
    type === "Flexbox" && flexDirection === "column" ? "height" : "width";
  const newComponentStyle = getFlexStyle(newComponent, dimension, pos);
  const existingComponentStyle = getFlexStyle(existingComponent, dimension);

  return [style, existingComponentStyle, newComponentStyle];
}

const isTargetFirst = (pos: DropPos) =>
  pos.position.SouthOrEast
    ? true
    : pos?.tab?.positionRelativeToTab === "before"
      ? false
      : pos.position.Header
        ? true
        : false;

function getLayoutSpecForWrapper(pos: DropPos): LayoutSpec {
  if (pos.position.Header) {
    return {
      type: "Stack",
      flexDirection: "column",
      showTabs: true,
    };
  } else {
    return {
      type: "Flexbox",
      flexDirection: pos.position.EastOrWest ? "row" : "column",
    };
  }
}
