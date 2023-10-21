import { dimension, uuid } from "@finos/vuu-utils";
import React, { cloneElement, CSSProperties, ReactElement } from "react";
import {
  ComponentWithId,
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

export interface LayoutProps extends ComponentWithId {
  active?: number;
  "data-path"?: string;
  children?: ReactElement[];
  column?: any;
  dropTarget?: any;
  key: string;
  layout?: any;
  path?: string;
  resizeable?: boolean;
  style: CSSProperties;
  type?: string;
  version?: number;
}

/**
 * parse the declarative JSX and clone adding layout attributes
 */
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
  const id = prevMatch ? prevId : props.id ?? uuid();
  const active = type === "Stack" ? props.active ?? prevActive : undefined;

  const key = id;
  const style = prevMatch ? prevStyle : getStyle(type, props, parentType);
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
  const kids = Array.isArray(children)
    ? children
    : React.isValidElement(children)
    ? [children]
    : [];
  return isContainer(type)
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
        }

        return previousChildren?.[i];
      })
    : children;
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
      ...expandFlex(typeof flex === "number" ? flex : 0),
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
    style = {
      ...style,
      flexBasis: "auto",
      flexGrow: 0,
      flexShrink: 0,
    };
  }

  return style;
};

export function layoutFromJson(
  { id = uuid(), type, children, props, state }: LayoutJSON,
  path: string
): ReactElement {
  const componentType = type.match(/^[a-z]/) ? type : ComponentRegistry[type];

  if (componentType === undefined) {
    throw Error(
      `layoutUtils unable to create component from JSON, unknown type ${type}`
    );
  }

  if (state) {
    setPersistentState(id, state);
  }

  return React.createElement(
    componentType,
    {
      id,
      ...props,
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
    for (const [key, value] of Object.entries(otherProps)) {
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
    for (const [k, v] of Object.entries(value)) {
      result[k] = serializeValue(v);
    }
    return result;
  }
}
