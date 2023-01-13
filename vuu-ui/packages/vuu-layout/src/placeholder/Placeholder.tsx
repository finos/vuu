import cx from "classnames";
import { HTMLAttributes } from "react";
import { registerComponent } from "../registry/ComponentRegistry";

import "./Placeholder.css";

const classBase = "vuuPlaceholder";

export interface PlaceholderProps extends HTMLAttributes<HTMLDivElement> {
  closeable?: boolean;
  flexFill?: boolean;
  resizeable?: boolean;
  shim?: boolean;
}

export const Placeholder = ({
  className,
  closeable,
  flexFill,
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
    </div>
  );
};

Placeholder.displayName = "Placeholder";
registerComponent("Placeholder", Placeholder);
