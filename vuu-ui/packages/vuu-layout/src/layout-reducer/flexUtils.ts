import React from "react";
import { CSSProperties, ReactElement, ReactNode } from "react";
import { uuid } from "@vuu-ui/vuu-utils";
import { ComponentRegistry } from "../registry/ComponentRegistry";
import { getProps, resetPath } from "../utils";
import { dimension, rect, rectTuple } from "../common-types";
import { DropPos } from "../drag-drop/dragDropTypes";
const placeHolderProps = { "data-placeholder": true, "data-resizeable": true };

const NO_STYLE = {};
const auto = "auto";
const defaultFlexStyle = {
  flexBasis: 0,
  flexGrow: 1,
  flexShrink: 1,
  height: auto,
  width: auto,
};

const CROSS_DIMENSION = {
  height: "width",
  width: "height",
};

export type flexDirection = "row" | "column";

type contraDimension = dimension;
type flexDimensionTuple = [dimension, contraDimension, flexDirection];
export type position = {
  height?: number;
  width?: number;
};

export const getFlexDimensions = (flexDirection: flexDirection = "row") => {
  if (flexDirection === "row") {
    return ["width", "height", "column"] as flexDimensionTuple;
  } else {
    return ["height", "width", "row"] as flexDimensionTuple;
  }
};

const isPercentageSize = (value: string | number) =>
  typeof value === "string" && value.endsWith("%");

export const getIntrinsicSize = (
  component: ReactElement
): { height?: number; width?: number } | undefined => {
  const { style: { width = auto, height = auto } = NO_STYLE } = component.props;

  // Eliminate 'auto' and percentage sizes
  const numHeight = typeof height === "number";
  const numWidth = typeof width === "number";

  if (numHeight && numWidth) {
    return { height, width };
  } else if (numHeight) {
    return { height };
  } else if (numWidth) {
    return { width };
  } else {
    return undefined;
  }
};

export function getFlexStyle(
  component: ReactElement,
  dimension: dimension,
  pos?: DropPos
) {
  const crossDimension = CROSS_DIMENSION[dimension];
  const {
    style: {
      [crossDimension]: intrinsicCrossSize = auto,
      ...intrinsicStyles
    } = NO_STYLE,
  } = component.props;

  if (pos && pos[dimension]) {
    return {
      ...intrinsicStyles,
      ...defaultFlexStyle,
      flexBasis: pos[dimension],
      flexGrow: 0,
      flexShrink: 0,
    };
  } else {
    return {
      ...intrinsicStyles,
      ...defaultFlexStyle,
      [crossDimension]: intrinsicCrossSize,
    };
  }
}

//TODO this is not comprehensive
export function hasUnboundedFlexStyle(component: ReactElement) {
  const { style: { flex, flexGrow, flexShrink, flexBasis } = NO_STYLE } =
    component.props;
  // console.log(`flex ${flex}, flexBasis ${flexBasis}, flexShrink ${flexShrink}, flexGrow ${flexGrow}`)
  if (typeof flex === "number") {
    return true;
  } else if (flexBasis === 0 && flexGrow === 1 && flexShrink === 1) {
    return true;
  } else if (typeof flexBasis === "number") {
    return false;
  } else {
    return true;
  }
}

export function getFlexOrIntrinsicStyle(
  component: ReactElement,
  dimension: dimension,
  pos: position
) {
  const crossDimension = CROSS_DIMENSION[dimension];
  const {
    style: {
      [dimension]: intrinsicSize = auto,
      [crossDimension]: intrinsicCrossSize = auto,
      ...intrinsicStyles
    } = NO_STYLE,
  } = component.props;

  if (intrinsicSize !== auto) {
    if (isPercentageSize(intrinsicSize)) {
      return {
        // Is this right? discrad the percenbtage size ?
        flexBasis: 0,
        flexGrow: 1,
        flexShrink: 1,
        [dimension]: undefined,
        [crossDimension]: intrinsicCrossSize,
      };
    } else {
      return {
        // or should we leave this as auto until user resizes ?
        flexBasis: intrinsicSize,
        flexGrow: 0,
        flexShrink: 0,
        [dimension]: intrinsicSize,
        [crossDimension]: intrinsicCrossSize,
      };
    }
  } else if (pos && pos[dimension]) {
    return {
      ...intrinsicStyles,
      ...defaultFlexStyle,
      flexBasis: pos[dimension],
      flexGrow: 0,
      flexShrink: 0,
    };
  } else {
    return {
      ...intrinsicStyles,
      // ...defaultFlexStyle,
      [crossDimension]: intrinsicCrossSize,
    };
  }
}

export function wrapIntrinsicSizeComponentWithFlexbox(
  component: ReactElement,
  flexDirection: flexDirection,
  path: string,
  clientRect?: rect,
  dropRect?: rectTuple
) {
  const wrappedChildren = [];
  let pathIndex = 0;
  let endPlaceholder;

  if (clientRect && dropRect) {
    let startPlaceholder;
    const [dropLeft, dropTop, dropRight, dropBottom] = dropRect;
    [startPlaceholder, endPlaceholder] =
      flexDirection === "column"
        ? [dropTop - clientRect.top, clientRect.bottom - dropBottom]
        : [dropLeft - clientRect.left, clientRect.right - dropRight];

    if (startPlaceholder) {
      wrappedChildren.push(
        createPlaceHolder(`${path}.${pathIndex++}`, startPlaceholder, {
          flexGrow: 0,
          flexShrink: 0,
        })
      );
    }
  } else {
    // If we don't pass the rect values, we are wrapping an existing child, this is always a trailing placeholder
    endPlaceholder = true;
  }

  const { version = 0, style } = getProps(component);

  wrappedChildren.push(
    resetPath(component, `${path}.${pathIndex++}`, {
      version: version + 1,
      style: {
        ...style,
        flexBasis: "auto",
        flexGrow: 0,
        flexShrink: 0,
      },
    })
  );

  if (endPlaceholder) {
    wrappedChildren.push(
      createPlaceHolder(`${path}.${pathIndex++}`, 0, undefined, {
        [`data-${flexDirection}-placeholder`]: true,
      })
    );
  }

  return createFlexbox(
    flexDirection,
    { resizeable: false, style: { flexBasis: "auto" } },
    wrappedChildren,
    path
  );
}

const getFlexValue = (flexBasis: number, flexFill: boolean) => {
  if (flexFill) {
    return undefined;
  } else if (flexBasis === 0) {
    return 1;
  } else {
    return 0;
  }
};

export function createFlexbox(
  flexDirection: flexDirection,
  props: any,
  children: ReactNode,
  path: string
) {
  const id = uuid();
  const { flexFill, style, resizeable = true } = props;
  const { flexBasis = flexFill ? undefined : "auto" } = style;
  const flex = getFlexValue(flexBasis, flexFill);
  return React.createElement<any>(
    ComponentRegistry.Flexbox,
    {
      id,
      key: id,
      path,
      flexFill,
      style: {
        ...style,
        flexDirection,
        flexBasis,
        flexGrow: flex,
        flexShrink: flex,
      },
      resizeable,
    },
    children
  );
}

const baseStyle = { flexGrow: 1, flexShrink: 1 };

export function createPlaceHolder(
  path: string,
  size: number,
  style?: CSSProperties,
  props?: any
) {
  const id = uuid();
  return React.createElement("div", {
    ...placeHolderProps,
    ...props,
    "data-path": path,
    id,
    key: id,
    style: { ...baseStyle, ...style, flexBasis: size },
  });
}
