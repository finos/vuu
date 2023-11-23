import React from "react";
import "./SvgArrow.css";

const classBase = "SvgArrow";

export interface ArrowProps {
  className?: string;
  radius?: number;
}

export const SvgArrow = ({ className, radius = 4 }: ArrowProps) => {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 200"
    >
      <g>
        <g className={classBase}>
          <circle cx="50" cy="20" r={radius} className={`${classBase}-shaft`} />
          <circle cx="50" cy="35" r={radius} className={`${classBase}-shaft`} />
          <circle cx="50" cy="50" r={radius} className={`${classBase}-shaft`} />
          <circle cx="50" cy="65" r={radius} className={`${classBase}-shaft`} />
          <circle cx="50" cy="80" r={radius} className={`${classBase}-shaft`} />

          <circle cx="25" cy="60" r={radius} className={`${classBase}-tip`} />
          <circle cx="35" cy="70" r={radius} className={`${classBase}-tip`} />
          <circle cx="65" cy="70" r={radius} className={`${classBase}-tip`} />
          <circle cx="75" cy="60" r={radius} className={`${classBase}-tip`} />
        </g>
      </g>
    </svg>
  );
};
