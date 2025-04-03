import { LayoutProps } from "@finos/vuu-layout";
import {
  elementImplementsJSONSerialization,
  LayoutJSON,
} from "@finos/vuu-utils";
import React, { ReactElement } from "react";
import { getProps } from "./propUtils";
import { typeOf } from "./typeOf";

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
