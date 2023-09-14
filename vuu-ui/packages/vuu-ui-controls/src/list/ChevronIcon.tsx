import cx from "classnames";
import { HTMLAttributes } from "react";

import "./ChevronIcon.css";

const classBase = "vuuChevronIcon";

type Direction = "up" | "down" | "left" | "right";

interface ChevronProps extends HTMLAttributes<HTMLSpanElement> {
  direction: Direction;
}

export const ChevronIcon = (props: ChevronProps) => {
  const { direction, ...htmlAttributes } = props;
  return (
    <span {...htmlAttributes} className={cx(classBase, direction)} />
  )
};
