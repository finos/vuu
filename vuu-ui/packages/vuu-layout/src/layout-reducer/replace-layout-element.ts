import React, { ReactElement } from "react";
import { getProp, getProps, nextStep } from "../utils";
import { ReplaceAction } from "./layoutTypes";
import { applyLayoutProps, LayoutProps } from "./layoutUtils";

export function replaceChild(
  model: ReactElement,
  { target, replacement }: ReplaceAction,
) {
  return _replaceChild(model, target, replacement);
}

export function _replaceChild(
  model: ReactElement,
  child: ReactElement,
  replacement: ReactElement<LayoutProps>,
) {
  const path = getProp(child, "path");
  const resizeable = getProp(child, "resizeable");
  const { style } = getProps(child);
  const newChild = applyLayoutProps(
    React.cloneElement(replacement, {
      resizeable,
      style: {
        ...style,
        ...replacement.props.style,
      },
    }),
    path,
  );

  return swapChild(model, child, newChild);
}

export function swapChild(
  model: ReactElement,
  child: ReactElement,
  replacement: ReactElement,
  op?: "collapse" | "expand",
): ReactElement {
  if (model === child) {
    return replacement;
  }

  const { idx, finalStep } = nextStep(
    getProp(model, "path"),
    getProp(child, "path"),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modelChildren = (model.props as any).children as ReactElement[];
  const children = modelChildren.slice();

  if (finalStep) {
    if (!op) {
      children[idx] = replacement;
    } else if (op === "collapse") {
      children[idx] = collapse(model, children[idx]);
    } else if (op === "expand") {
      children[idx] = expand(children[idx]);
    }
  } else {
    children[idx] = swapChild(children[idx], child, replacement, op);
  }
  return React.cloneElement(model, undefined, children);
}

function collapse(parent: ReactElement, child: ReactElement) {
  const { style: parentStyle } = getProps(parent);
  const { style: childStyle } = getProps(child);

  const { width, height, flexBasis, flexShrink, flexGrow, ...rest } =
    childStyle;

  const restoreStyle = {
    width,
    height,
    flexBasis,
    flexShrink,
    flexGrow,
  };

  const style = {
    ...rest,
    flexBasis: 0,
    flexGrow: 0,
    flexShrink: 0,
  };
  const collapsed =
    parentStyle.flexDirection === "row"
      ? "vertical"
      : parentStyle.flexDirection === "column"
        ? "horizontal"
        : false;

  if (collapsed) {
    return React.cloneElement(child, {
      collapsed,
      restoreStyle,
      style,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  }
  return child;
}

function expand(child: ReactElement) {
  const { style: childStyle, restoreStyle } = getProps(child);

  const { flexBasis, flexShrink, flexGrow, ...rest } = childStyle;

  const style = {
    ...rest,
    ...restoreStyle,
  };

  return React.cloneElement(child, {
    collapsed: false,
    style,
    restoreStyle: undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
}
