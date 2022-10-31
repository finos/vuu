import { uuid } from "@vuu-ui/utils";
import { CSSProperties, ReactElement } from "react";
import React, { cloneElement } from "react";
import { dimension } from "../common-types";
import {
  ComponentRegistry,
  isContainer,
  isLayoutComponent,
} from "../registry/ComponentRegistry";
import {
  getPersistentState,
  hasPersistentState,
  setPersistentState,
} from "../use-persistent-state";
import { expandFlex, getProps, typeOf } from "../utils";
import { LayoutJSON, LayoutModel, layoutType } from "./layoutTypes";

export const getManagedDimension = (
  style: CSSProperties
): [dimension, dimension] =>
  style.flexDirection === "column" ? ["height", "width"] : ["width", "height"];

const theKidHasNoStyle: CSSProperties = {};

export const applyLayoutProps = (component: ReactElement, path = "0") => {
  const [layoutProps, children] = getChildLayoutProps(
    typeOf(component) as string,
    component.props,
    path
  );
  return React.cloneElement(component, layoutProps, children);
};

export interface LayoutProps {
  active?: number;
  "data-path"?: string;
  children?: ReactElement[];
  column?: any;
  dropTarget?: any;
  id: string;
  key: string;
  layout?: any;
  path?: string;
  resizeable?: boolean;
  style: CSSProperties;
  type?: string;
  version?: number;
}

export const processLayoutElement = (
  layoutElement: ReactElement,
  previousLayout?: ReactElement
): ReactElement => {
  const type = typeOf(layoutElement) as string;
  const [layoutProps, children] = getChildLayoutProps(
    type,
    layoutElement.props,
    "0",
    undefined,
    previousLayout
  );
  return cloneElement(layoutElement, layoutProps, children);
};

export const applyLayout = (
  type: layoutType,
  props: LayoutProps,
  previousLayout?: LayoutModel
): LayoutModel => {
  // This works if the root layout is itself loaded from JSON
  const [layoutProps, children] = getChildLayoutProps(
    type,
    props,
    "0",
    undefined,
    previousLayout
  );
  return {
    ...props,
    ...layoutProps,
    type,
    children,
  };
};

function getLayoutProps(
  type: string,
  props: LayoutProps,
  path = "0",
  parentType: string | null = null,
  previousLayout?: LayoutModel
): LayoutProps {
  const {
    active: prevActive = 0,
    "data-path": dataPath,
    path: prevPath = dataPath,
    id: prevId,
    style: prevStyle,
  } = getProps(previousLayout);

  const prevMatch = typeOf(previousLayout) === type && path === prevPath;
  // TODO is there anything else we can re-use from previousType ?
  const id = prevMatch ? prevId : props.id ?? uuid();
  const active = type === "Stack" ? props.active ?? prevActive : undefined;

  const key = id;
  //TODO this might be wrong if client has updated style ?
  const style = prevMatch ? prevStyle : getStyle(type, props, parentType);
  // TODO need two  interfaces to cover these two scenarios
  return isLayoutComponent(type)
    ? { id, key, path, style, type, active }
    : { id, key, style, "data-path": path };
}

function getChildLayoutProps(
  type: string,
  props: LayoutProps,
  path: string,
  parentType: string | null = null,
  previousLayout?: LayoutModel
): [LayoutProps, ReactElement[]] {
  const layoutProps = getLayoutProps(
    type,
    props,
    path,
    parentType,
    previousLayout
  );

  if (props.layout && !previousLayout) {
    // reconstitute children from layout. Will always be a single child,
    // but return as array to make subsequent processing more consistent
    return [layoutProps, [layoutFromJson(props.layout, `${path}.0`)]];
  }

  const previousChildren =
    (previousLayout as any)?.children ?? previousLayout?.props?.children;
  const hasDynamicChildren = props.dropTarget && previousChildren;
  const children = hasDynamicChildren
    ? previousChildren
    : getLayoutChildren(type, props.children, path, previousChildren);
  return [layoutProps, children];
}

function getLayoutChildren(
  type: string,
  children?: ReactElement[],
  path = "0",
  previousChildren?: ReactElement[]
) {
  // Avoid React.Children.map here, it messes with the keys.
  const kids = Array.isArray(children)
    ? children
    : React.isValidElement(children)
    ? [children]
    : [];
  return isContainer(type) /*|| isView(type)*/
    ? kids.map((child, i) => {
        const childType = typeOf(child) as string;
        const previousType = typeOf(previousChildren?.[i]);
        if (!previousType || childType === previousType) {
          const [layoutProps, children] = getChildLayoutProps(
            childType,
            child.props,
            `${path}.${i}`,
            type,
            previousChildren?.[i]
          );
          return React.cloneElement(child, layoutProps, children);
        } else {
          //TODO is this always correct ?
          return previousChildren?.[i];
        }
      })
    : // TODO should we check the types of children ?
      // : previousChildren ?? children;
      //TODO this is new - is it dangerous ?
      children;
}

const getStyle = (
  type: string,
  props: LayoutProps,
  parentType?: string | null
) => {
  let { style = theKidHasNoStyle } = props;
  if (type === "Flexbox") {
    style = {
      flexDirection: props.column ? "column" : "row",
      ...style,
      display: "flex",
    };
  }

  if (style.flex) {
    const { flex, ...otherStyles } = style;
    style = {
      ...otherStyles,
      ...expandFlex(flex),
    };
  } else if (parentType === "Stack") {
    style = {
      ...style,
      ...expandFlex(1),
    };
  } else if (
    parentType === "Flexbox" &&
    (style.width || style.height) &&
    style.flexBasis === undefined
  ) {
    // strictly, this should depend on flexDirection
    style = {
      ...style,
      flexBasis: "auto",
      flexGrow: 0,
      flexShrink: 0,
    };
  }

  return style;
};

//TODO we don't need id beyond view
export function layoutFromJson(
  { id = uuid(), type, children, props, state }: LayoutJSON,
  path: string
): ReactElement {
  // if (type === "DraggableLayout") {
  //   return layoutFromJson(children[0], "0");
  // }

  const componentType = type.match(/^[a-z]/) ? type : ComponentRegistry[type];

  if (componentType === undefined) {
    throw Error(`Unable to create component from JSON, unknown type ${type}`);
  }

  if (state) {
    setPersistentState(id, state);
  }

  return React.createElement(
    componentType,
    {
      ...props,
      id,
      key: id,
      path,
    },
    children
      ? children.map((child, i) => layoutFromJson(child, `${path}.${i}`))
      : undefined
  );
}

export function layoutToJSON(component: ReactElement) {
  return componentToJson(component);
}

export function componentToJson(component: ReactElement): LayoutJSON {
  const type = typeOf(component) as string;
  const { id, children, type: _omit, ...props } = getProps(component);

  const state = hasPersistentState(id) ? getPersistentState(id) : undefined;

  return {
    id,
    type,
    props: serializeProps(props as LayoutProps),
    state,
    children: React.Children.map(children, componentToJson),
  };
}

export function serializeProps(props?: LayoutProps) {
  if (props) {
    const { path, ...otherProps } = props;
    const result: { [key: string]: any } = {};
    for (let [key, value] of Object.entries(otherProps)) {
      result[key] = serializeValue(value);
    }
    return result;
  }
}

function serializeValue(value: unknown): any {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  } else if (Array.isArray(value)) {
    return value.map(serializeValue);
  } else if (typeof value === "object" && value !== null) {
    const result: { [key: string]: any } = {};
    for (let [k, v] of Object.entries(value)) {
      result[k] = serializeValue(v);
    }
    return result;
  }
}
