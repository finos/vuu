import { HTMLAttributes } from "react";
import cx from "clsx";

import "./Icon.css";

const classBase = "vuuIcon";

export interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  name: string;
}

export const Icon = ({ className, name, ...htmlAttributes }: IconProps) => {
  return (
    <span
      {...htmlAttributes}
      className={cx(classBase, className)}
      data-icon={name}
    />
  );
};
