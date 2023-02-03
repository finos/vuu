import classnames from "classnames";
import { ForwardedRef, forwardRef, HTMLAttributes } from "react";
import { registerComponent } from "./registry/ComponentRegistry";

import "./DraggableLayout.css";

export interface DraggableLayoutProps extends HTMLAttributes<HTMLDivElement> {
  dropTarget?: boolean;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DraggableLayout = forwardRef(function DraggableLayout(
  {
    children,
    className: classNameProp,
    dropTarget,
    ...htmlAttributes
  }: DraggableLayoutProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const className = classnames("DraggableLayout", classNameProp);
  return (
    <div className={className} ref={forwardedRef} {...htmlAttributes}>
      {children}
    </div>
  );
});

const componentName = "DraggableLayout";

DraggableLayout.displayName = componentName;

registerComponent(componentName, DraggableLayout, "container");
