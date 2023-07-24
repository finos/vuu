import React, { HTMLAttributes } from "react";
import cx from "classnames";

import "./SvgDottySeparator.css";

const classBase = "SvgDottySeparator";

export interface DottySeparatorProps extends HTMLAttributes<SVGElement> {
  className?: string;
  orientation?: "vertical" | "horizontal";
}

export const SvgDottySeparator = ({
  className,
  ...svgAttributes
}: DottySeparatorProps) => {
  return (
    <svg
      {...svgAttributes}
      className={cx(classBase, className)}
      viewBox="0 0 7 44"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="3.5" cy="22.5" r="3.5" />
      <circle cx="3.5" cy="33.5" r="2.5" />
      <circle cx="3.5" cy="42.5" r="1.5" />
      <circle cx="3.5" cy="11.5" r="2.5" />
      <circle cx="3.5" cy="1.5" r="1.5" />
    </svg>
  );
};
