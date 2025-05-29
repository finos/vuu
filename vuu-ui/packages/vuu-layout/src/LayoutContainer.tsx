import { registerComponent } from "@vuu-ui/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { ForwardedRef, forwardRef, HTMLAttributes } from "react";

import layoutContainerCss from "./LayoutContainer.css";

export interface LayoutContainerProps extends HTMLAttributes<HTMLDivElement> {
  dropTarget?: boolean;
  resizeable?: boolean;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const LayoutContainer = forwardRef(function LayoutContainer(
  {
    children,
    className: classNameProp,
    dropTarget,
    resizeable: _, // ignore, its just a marker used by the layout system
    ...htmlAttributes
  }: LayoutContainerProps,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-layout-container",
    css: layoutContainerCss,
    window: targetWindow,
  });

  const className = cx("vuuLayoutContainer", classNameProp);
  return (
    <div className={className} ref={forwardedRef} {...htmlAttributes}>
      {children}
    </div>
  );
});

const componentName = "LayoutContainer";

LayoutContainer.displayName = componentName;

registerComponent(componentName, LayoutContainer, "container");
