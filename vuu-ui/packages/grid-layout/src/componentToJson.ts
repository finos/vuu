import { elementImplementsJSONSerialization } from "@vuu-ui/vuu-utils";
import React, { CSSProperties, ReactElement } from "react";
import { getProps } from "./propUtils";
import { typeOf } from "./typeOf";

export interface LayoutJSON<T extends object = object> {
  active?: number;
  children?: LayoutJSON[];
  id?: string;
  props?: T;
  state?: unknown;
  style?: CSSProperties;
  title?: string;
  type: string;
}

export interface LayoutProps {
  active?: number;
  "data-path"?: string;
  children?: ReactElement[];
  /**
   * indicates flexDirection for Flexbox
   */
  column?: boolean;
  dropTarget?: boolean;
  i8d: string;
  key: string;
  // layout?: LayoutJSON;
  path?: string;
  resizeable?: boolean;
  style: CSSProperties;
  type?: string;
  version?: number;
}

export function componentToJson(element: ReactElement): LayoutJSON {
  if (elementImplementsJSONSerialization(element)) {
    return element.type.toJSON(element);
  } else {
    const type = typeOf(element) as string;
    const { id, children, type: _omit, ...props } = getProps(element);

    // const state = hasPersistentState(id) ? getPersistentState(id) : undefined;
    const state = undefined;

    return {
      id,
      type,
      props: serializeProps(props as LayoutProps),
      state,
      children: React.Children.map(children, componentToJson),
    };
  }
}

export function serializeProps(props?: LayoutProps) {
  if (props) {
    const { path, ...otherProps } = props;
    const result: { [key: string]: unknown } = {};
    for (const [key, value] of Object.entries(otherProps)) {
      result[key] = serializeValue(value);
    }
    return result;
  }
}

function serializeValue(value: unknown): unknown {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  } else if (Array.isArray(value)) {
    return value.map(serializeValue);
  } else if (typeof value === "object" && value !== null) {
    const result: { [key: string]: unknown } = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = serializeValue(v);
    }
    return result;
  }
}
