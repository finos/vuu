import { getLayoutComponent, LayoutJSON, uuid } from "@finos/vuu-utils";
import React, { ReactElement } from "react";

export function layoutFromJson(
  { active, id = uuid(), type, children, props, state }: LayoutJSON,
  path: string,
): ReactElement {
  const componentType = type.match(/^[a-z]/) ? type : getLayoutComponent(type);

  if (componentType === undefined) {
    throw Error(
      `layoutUtils unable to create component from JSON, unknown type ${type}`,
    );
  }

  if (state) {
    console.log(`devide how we deal with state`, {
      state,
    });
    //   setPersistentState(id, state);
  }

  return React.createElement(
    componentType,
    {
      active,
      id,
      ...props,
      key: id,
      path,
    },
    children
      ? children.map((child, i) => layoutFromJson(child, `${path}.${i}`))
      : undefined,
  );
}
