import { getLayoutComponent, uuid } from "@vuu-ui/vuu-utils";
import React, { ReactElement } from "react";
import { LayoutJSON } from "./componentToJson";

export function layoutFromJson({
  active,
  id = uuid(),
  type,
  children,
  props,
  state,
}: LayoutJSON): ReactElement {
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
    },
    children ? children.map((child, i) => layoutFromJson(child)) : undefined,
  );
}
