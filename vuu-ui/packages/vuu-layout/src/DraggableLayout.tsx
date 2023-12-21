import classnames from "clsx";
import { ForwardedRef, forwardRef, HTMLAttributes } from "react";
import { registerComponent } from "./registry/ComponentRegistry";

import "./DraggableLayout.css";

export interface DraggableLayoutProps extends HTMLAttributes<HTMLDivElement> {
  dropTarget?: boolean;
  resizeable?: boolean;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DraggableLayout = forwardRef(function DraggableLayout(
  {
    children,
    className: classNameProp,
    dropTarget,
    resizeable: _, // ignore, its just a marker used by the layout system
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
