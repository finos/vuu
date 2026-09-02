import { getLayoutComponent, uuid } from "@vuu-ui/vuu-utils";
import React, { type ReactElement } from "react";
import type { LayoutJSON, LayoutJSONChild } from "./componentToJson";

const childFromJson = (child: LayoutJSONChild) =>
  typeof child === "object" ? layoutFromJson(child) : child;

export function layoutFromJson({
  active,
  id = uuid(),
  type,
  children,
  props,
}: LayoutJSON): ReactElement {
  const componentType = type.match(/^[a-z]/) ? type : getLayoutComponent(type);

  if (componentType === undefined) {
    throw Error(
      `layoutUtils unable to create component from JSON, unknown type ${type}`,
    );
  }

  const componentProps = {
    active,
    id,
    ...props,
    key: id,
  };
  return children?.length
    ? React.createElement(
        componentType,
        componentProps,
        children.map(childFromJson),
      )
    : React.createElement(componentType, componentProps);
}
