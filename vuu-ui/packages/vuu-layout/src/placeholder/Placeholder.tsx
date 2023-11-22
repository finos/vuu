import cx from "classnames";
import { HTMLAttributes } from "react";
import { registerComponent } from "../registry/ComponentRegistry";

import "./Placeholder.css";
import { LayoutStartPanel } from "./LayoutStartPanel";

const classBase = "vuuPlaceholder";

export interface PlaceholderProps extends HTMLAttributes<HTMLDivElement> {
  closeable?: boolean;
  flexFill?: boolean;
  resizeable?: boolean;
  showStartMenu?: boolean;
  /**
   * shim is only when we're dealing with intrinsically sized children, which is never
   * in an actual application. Intrinsic sizing is still experimental.
   */
  shim?: boolean;
}

export const Placeholder = ({
  className,
  closeable,
  flexFill,
  showStartMenu = true,
  resizeable,
  shim,
  ...props
}: PlaceholderProps) => {
  return (
    <div
      className={cx(classBase, className, {
        [`${classBase}-shim`]: shim,
      })}
      {...props}
      data-placeholder
      data-resizeable
    >
      {showStartMenu ? <LayoutStartPanel /> : null}
    </div>
  );
};

Placeholder.displayName = "Placeholder";
registerComponent("Placeholder", Placeholder);
