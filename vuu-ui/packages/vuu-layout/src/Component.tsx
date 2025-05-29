import React, { forwardRef, HTMLAttributes } from "react";
import { registerComponent } from "@vuu-ui/vuu-utils";

export interface ComponentProps extends HTMLAttributes<HTMLDivElement> {
  resizeable?: boolean;
}

const Component = forwardRef(function Component(
  { resizeable, ...props }: ComponentProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return <div {...props} className="Component" ref={ref} />;
}) as React.FunctionComponent<ComponentProps>;
Component.displayName = "Component";

export default Component;

registerComponent("Component", Component, "component");
